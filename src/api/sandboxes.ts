/** Sandboxes on Lightning's API (api/projects.md, from "List a project's sandboxes"): the API's shapes, the mappers, the keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResourceStatus } from "@/types/resource";
import type { MergePreviewResult, MergeValues, SandboxRow, SandboxValues } from "@/types/sandboxes";
import { combinedStatus, listAll, request, statusOf } from "./client";
import { projectKeys, projectQuery, useProjectTree, type ApiProject } from "./projects";

type SandboxAction = "update_sandbox" | "delete_sandbox" | "merge_sandbox" | "cancel_scheduled_deletion";

/** A sandbox as `GET /api/projects/:id/sandboxes` lists it, with the planned `include=scheduled,permissions`. */
interface ApiSandbox {
  id: string;
  attributes: Omit<ApiProject["attributes"], "permissions"> & {
    scheduled_deletion: string | null;
    permissions?: Partial<Record<SandboxAction, boolean>>;
  };
}

/** What `POST …/merge_previews` answers. */
interface ApiMergePreview {
  target_project_id: string;
  workflows: { name: string; source_workflow_id: string | null; target_workflow_id: string | null; change: "new" | "changed" | "unchanged" | "deleted"; diverged: boolean }[];
  credentials: { credential_id: string; name: string }[];
}

/**
 * The workspace's cards: its top project first, then the listed sandboxes in
 * the server's order. `parent_id` is the nearest project above that the
 * viewer can open, so the counts and targets cover only what they can see
 * (docs/api-gaps.md). The top project's card has no actions.
 */
function workspaceRows(root: ApiProject, sandboxes: ApiSandbox[], currentId: string): SandboxRow[] {
  const all: ApiSandbox[] = [{ ...root, attributes: { ...root.attributes, scheduled_deletion: null, permissions: {} } }, ...sandboxes];
  const live = all.filter((p) => !p.attributes.scheduled_deletion);
  const below = (id: string): ApiSandbox[] => all.filter((p) => p.attributes.parent_id === id).flatMap((c) => [c, ...below(c.id)]);
  return all.map((p) => {
    const a = p.attributes;
    const own = below(p.id);
    const parent = all.find((x) => x.id === a.parent_id);
    const targets = [...live.filter((x) => x === parent), ...live.filter((x) => x !== p && x !== parent && !own.includes(x))];
    return {
      id: p.id,
      name: a.name,
      description: a.description,
      color: a.color ?? null,
      parentId: parent?.id ?? null,
      parentName: parent?.attributes.name ?? null,
      scheduledDeletion: a.scheduled_deletion,
      canEdit: !!a.permissions?.update_sandbox,
      canDelete: !!a.permissions?.delete_sandbox,
      canMerge: !!a.permissions?.merge_sandbox,
      canCancelDeletion: !!a.permissions?.cancel_scheduled_deletion,
      descendantCount: own.filter((x) => !x.attributes.scheduled_deletion).length,
      holdsCurrent: p.id === currentId || own.some((x) => x.id === currentId),
      mergeTargets: targets.map((x) => ({ id: x.id, name: x.attributes.name })),
    };
  });
}

/** A preview as the merge dialog lists it: unchanged workflows left out, by name. */
function mergePreview(p: ApiMergePreview): MergePreviewResult {
  return {
    targetId: p.target_project_id,
    workflows: p.workflows
      // A change the page doesn't know (or "unchanged") isn't one to merge.
      .filter((w) => ["new", "changed", "deleted"].includes(w.change))
      .map((w) => ({ id: (w.change === "deleted" ? w.target_workflow_id : w.source_workflow_id)!, name: w.name, isDiverged: w.diverged, isDeleted: w.change === "deleted" }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    credentials: p.credentials.map((c) => ({ id: c.credential_id, name: c.name })),
  };
}

// Under the project keys, so a project's save or deletion reloads its workspace too.
export const sandboxKeys = {
  under: (rootId: string) => [...projectKeys.one(rootId), "sandboxes"] as const,
  mergePreview: (sandboxId: string, targetId: string) => [...projectKeys.one(sandboxId), "merge_preview", targetId] as const,
};

/**
 * The workspace a project is in, from as high up as the viewer can open (the
 * planned `depth=all` tree, walked up `parent_id`): that project's card
 * first, then every sandbox below it they're a member of, live and
 * scheduled, by name; and where loading them stands.
 */
export function useSandboxes(projectId: string): { status: ResourceStatus; workspace: SandboxRow[]; rootIsSandbox: boolean } {
  const tree = useProjectTree();
  let top = tree.projects.find((p) => p.id === projectId);
  while (top?.parentId) top = tree.projects.find((p) => p.id === top!.parentId);
  const root = useQuery(projectQuery(top?.id));
  const list = useQuery({
    queryKey: sandboxKeys.under(top?.id ?? ""),
    enabled: top !== undefined,
    queryFn: () => listAll<ApiSandbox>(`/api/projects/${top!.id}/sandboxes?depth=all&include=scheduled,permissions`, "data"),
  });
  return {
    status: combinedStatus(tree.status, statusOf(root), statusOf(list)),
    workspace: root.data && list.data ? workspaceRows(root.data, list.data, projectId) : [],
    rootIsSandbox: !!top?.isSandbox,
  };
}

/** Why the plan allows no more sandboxes in a project (the planned `limits.sandboxes`), or null while it does. */
export function useSandboxLimit(projectId: string): string | null {
  const { data } = useQuery({ ...projectQuery(projectId), select: (p) => p.attributes.limits?.sandboxes });
  return data && !data.allowed ? data.message : null;
}

/**
 * What merging a sandbox into a target would do, asked for each target the
 * dialog picks. A POST that writes nothing, kept as a query under the
 * sandbox, so going back to a target answers at once and any project save
 * asks again.
 */
export function useMergePreview(): (sandbox: SandboxRow, targetId: string) => Promise<MergePreviewResult> {
  const queryClient = useQueryClient();
  return (sandbox, targetId) =>
    queryClient
      .query({
        queryKey: sandboxKeys.mergePreview(sandbox.id, targetId),
        queryFn: () =>
          request<ApiMergePreview>("POST", `/api/projects/${sandbox.parentId}/sandboxes/${sandbox.id}/merge_previews`, { target_project_id: targetId }),
        staleTime: 60_000,
      })
      .then(mergePreview);
}

/**
 * Create, rename or recolour, and merge. Each resolves once the lists have
 * reloaded and rejects with the `ApiError`, whose field errors are keyed as
 * the body is (`name`). Create answers the new sandbox's id. Deleting and
 * restoring one are `useProjectSaves`'s, since a sandbox is a project.
 */
export function useSandboxSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
  const create = useMutation({
    mutationFn: ({ parentId, values }: { parentId: string; values: SandboxValues }) =>
      request<{ data: ApiProject }>("PUT", `/api/projects/${parentId}/sandboxes/${crypto.randomUUID()}`, values),
    onSuccess: reload,
  });
  // PUT replaces the description too, so it goes back as it was.
  const update = useMutation({
    mutationFn: ({ sandbox, values }: { sandbox: SandboxRow; values: SandboxValues }) =>
      request("PUT", `/api/projects/${sandbox.id}`, { ...values, description: sandbox.description }),
    onSuccess: reload,
  });
  // deleted_target_workflow_ids and credential_ids are planned. `leave` runs before the lists reload, as useProjectSaves' delete
  // has it, since the merge schedules the sandbox for deletion and the page may be in it.
  const merge = useMutation({
    mutationFn: ({ sandbox, values }: { sandbox: SandboxRow; values: MergeValues; leave: () => void }) =>
      request("POST", `/api/projects/${sandbox.parentId}/sandboxes/${sandbox.id}/merges`, {
        target_project_id: values.targetId,
        workflow_ids: values.workflowIds,
        deleted_target_workflow_ids: values.deletedWorkflowIds,
        credential_ids: values.credentialIds,
      }),
    onSuccess: (_answer, { leave }) => {
      leave();
      return reload();
    },
  });
  return {
    create: async (parentId: string, values: SandboxValues) => (await create.mutateAsync({ parentId, values })).data.id,
    update: async (sandbox: SandboxRow, values: SandboxValues) => void (await update.mutateAsync({ sandbox, values })),
    merge: async (sandbox: SandboxRow, values: MergeValues, leave: () => void) => void (await merge.mutateAsync({ sandbox, values, leave })),
  };
}

/**
 * Sandboxes on the pretend server (api/projects.md, from "List a project's
 * sandboxes"). A sandbox is a project with a parent; renaming, deleting and
 * restoring one go through the project routes. There's no fake workflow
 * store yet, so making a sandbox copies no workflows and a merge changes
 * none: the preview reads what each sandbox changed from `mergeFixtures`.
 */
import { mergeFixtures } from "@/mock-data/sandboxes";
import { workflowsIn } from "@/mock-data/workflows";
import type { Project } from "@/types/projects";
import { badInclude, forbidden, invalid, isUuid, json, notFound, now, ORIGIN, paged, problem, type Body, type Handler, type Problem } from "./answers";
import { permissionsIn } from "./permissions";
import {
  addProject,
  canEnter,
  DAY_MS,
  fakeProjects,
  findProject,
  isEditorIn,
  isScheduled,
  managesSandbox,
  nameAndColorErrors,
  projectEntry,
  roleOf,
  rootOf,
  scheduleTree,
  treeOf,
} from "./projects";
import { currentUser, PURGE_DELETED_AFTER_DAYS } from "./session";

const SANDBOX_KEYS = ["name", "color", "env", "dataclip_ids"];
const MERGE_KEYS = ["target_project_id", "workflow_ids", "deleted_target_workflow_ids", "credential_ids"];
// Lightning's instance default.
const MAX_DEPTH = 5;

type Errors = NonNullable<Problem["errors"]>;
const unknownKeys = (body: Body, known: string[]): Errors =>
  Object.keys(body)
    .filter((key) => !known.includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
const childrenOf = (id: string) => fakeProjects().filter((p) => p.parentId === id);
const depthOf = (p: Project): number => (p.parentId ? 1 + depthOf(findProject(p.parentId)!) : 0);
// As GET /api/projects/:id answers it.
const answer = (status: number, p: Project) => json(status, { data: projectEntry(p), included: [], links: { self: `${ORIGIN}/api/projects/${p.id}` } });

// The planned include=permissions, by Lightning's sandbox policy (policies/sandboxes.ex).
function sandboxPermissions(p: Project) {
  const manage = managesSandbox(p);
  const live = !isScheduled(p.id);
  return { update_sandbox: manage && live, delete_sandbox: manage && live, merge_sandbox: manage && live, cancel_scheduled_deletion: manage && !live };
}

/** The sandbox `id` somewhere under `projectId`, if the caller may merge it: 404 when it isn't under, 403 when they may not. */
function mergeable({ project_id, id }: Record<string, string>): Project | Response {
  const parent = findProject(project_id);
  if (!parent || !canEnter(parent)) return forbidden();
  const sandbox = findProject(id);
  if (!sandbox || sandbox.id === parent.id || !treeOf(parent).includes(sandbox)) return notFound();
  if (!canEnter(sandbox) || !sandboxPermissions(sandbox).merge_sandbox) return forbidden();
  return sandbox;
}

/** Where the body says to merge into (the parent by default), or the 422 for one it can't. */
function targetOf(sandbox: Project, body: Body): Project | Response {
  const target = findProject((body["target_project_id"] as string | undefined) ?? sandbox.parentId ?? undefined);
  if (!target || treeOf(sandbox).includes(target) || isScheduled(target.id) || rootOf(target) !== rootOf(sandbox)) {
    return invalid([{ code: "invalid", detail: "can't merge into that project", pointer: "#/target_project_id" }]);
  }
  return target;
}

// Workflows paired by name. Divergence and deletions are only known against the parent, as the replica had them.
function preview(sandbox: Project, target: Project) {
  const changes = mergeFixtures[sandbox.id];
  const theirs = workflowsIn(target.id);
  const atParent = target.id === sandbox.parentId;
  return {
    target_project_id: target.id,
    workflows: [
      ...(changes?.workflows ?? []).map((w) => {
        const t = theirs.find((x) => x.name === w.name);
        return { name: w.name, source_workflow_id: w.id, target_workflow_id: t?.id ?? null, change: !t ? "new" : w.changed ? "changed" : "unchanged", diverged: atParent && !!t && !!w.diverged };
      }),
      ...(atParent ? theirs.filter((t) => changes?.deletedNames.includes(t.name)) : []).map((t) => ({
        name: t.name,
        source_workflow_id: null,
        target_workflow_id: t.id,
        change: "deleted",
        diverged: false,
      })),
    ],
    credentials: (changes?.credentials ?? []).map((c) => ({ credential_id: c.id, name: c.name })),
  };
}

export const sandboxRoutes: Record<string, Handler> = {
  // depth=all, include=scheduled and include=permissions are planned. Only sandboxes the caller is a member of, as Lightning lists them.
  "GET /api/projects/:project_id/sandboxes": ({ project_id }, _body, query) => {
    const parent = findProject(project_id);
    if (!parent || !canEnter(parent)) return forbidden();
    const refused = badInclude(query, ["scheduled", "permissions"]);
    if (refused) return refused;
    const include = (query.get("include") ?? "").split(",");
    const rows = (query.get("depth") === "all" ? treeOf(parent).slice(1) : childrenOf(parent.id))
      .filter((p) => roleOf(p) && (include.includes("scheduled") || !isScheduled(p.id)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const entry = projectEntry(p, { members: false });
        return include.includes("permissions") ? { ...entry, attributes: { ...entry.attributes, permissions: sandboxPermissions(p) } } : entry;
      });
    return json(200, paged(`/api/projects/${parent.id}/sandboxes`, rows, query));
  },

  // Makes a sandbox under :project_id, or answers the one already there unchanged. `env` is taken and not kept: no route sends it back.
  "PUT /api/projects/:project_id/sandboxes/:id": ({ project_id, id }, body) => {
    const parent = findProject(project_id);
    if (!parent || !canEnter(parent) || !permissionsIn(parent)["provision_sandbox"] || !isUuid(id!)) return forbidden();
    const existing = findProject(id);
    if (existing) return existing.parentId === parent.id ? answer(200, existing) : forbidden();
    // Scheduled siblings count: their names are still taken.
    const errors = [...unknownKeys(body, SANDBOX_KEYS), ...nameAndColorErrors(body, childrenOf(parent.id))];
    if (errors.length) return invalid(errors);
    const { name, color } = body;
    // Lightning's message, with no code or pointer (docs/api-gaps.md, nesting depth).
    if (depthOf(parent) + 1 > MAX_DEPTH) return problem({ status: 422, code: "invalid", detail: "Maximum sandbox nesting depth reached" });

    const at = now();
    const me = currentUser().id;
    const sandbox: Project = {
      ...parent,
      id: id!,
      name: name as string,
      description: "",
      parentId: parent.id,
      color: (color as string | null | undefined) ?? null,
      // The parent's members come along, its owner as an admin; the caller owns the sandbox.
      members: [
        ...parent.members.filter((m) => m.userId !== me).map((m) => ({ ...m, role: m.role === "owner" ? ("admin" as const) : m.role })),
        { userId: me, role: "owner", failureAlert: true, digest: "never" },
      ],
      lastUpdatedAt: at,
      insertedAt: at,
    };
    addProject(sandbox);
    return answer(201, sandbox);
  },

  "POST /api/projects/:project_id/sandboxes/:id/merge_previews": (params, body) => {
    const sandbox = mergeable(params);
    if (sandbox instanceof Response) return sandbox;
    const target = targetOf(sandbox, body);
    if (target instanceof Response) return target;
    return json(200, preview(sandbox, target));
  },

  // Planned: deleted_target_workflow_ids, credential_ids, and scheduling the sandbox (and its own sandboxes) for deletion.
  "POST /api/projects/:project_id/sandboxes/:id/merges": (params, body) => {
    const sandbox = mergeable(params);
    if (sandbox instanceof Response) return sandbox;
    const target = targetOf(sandbox, body);
    if (target instanceof Response) return target;
    if (!isEditorIn(target.id)) {
      return problem({ status: 403, code: "forbidden", detail: "You are not authorized to merge into this project" });
    }
    const errors = unknownKeys(body, MERGE_KEYS);
    const rows = preview(sandbox, target).workflows;
    const listed = (key: string, ids: (string | null)[]) => {
      const sent = body[key];
      if (sent !== undefined && (!Array.isArray(sent) || sent.some((x) => !ids.includes(x as string)))) {
        errors.push({ code: "not_found", detail: "names a workflow the preview doesn't list", pointer: `#/${key}` });
      }
    };
    listed("workflow_ids", rows.filter((w) => w.change !== "deleted").map((w) => w.source_workflow_id));
    listed("deleted_target_workflow_ids", rows.filter((w) => w.change === "deleted").map((w) => w.target_workflow_id));
    if (errors.length) return invalid(errors);
    scheduleTree(sandbox, now(new Date(Date.now() + PURGE_DELETED_AFTER_DAYS * DAY_MS)));
    return answer(201, target);
  },
};

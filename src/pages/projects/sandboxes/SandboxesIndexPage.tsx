import { useRef, useState } from "react";
import { sandboxColorPalette } from "@/constants";
import Button from "@/components/primitives/Button";
import ListPage from "@/components/patterns/ListPage";
import { useToast } from "@/components/primitives/Toast";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import DeleteSandboxModal from "@/components/domain/DeleteSandboxModal";
import MergeSandboxModal from "@/components/projects/sandboxes/MergeSandboxModal";
import SandboxFormModal from "@/components/projects/sandboxes/SandboxFormModal";
import WorkspaceList from "@/components/projects/sandboxes/WorkspaceList";
import type { CurrentProject } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import type { MergePreviewResult, MergeValues, SandboxRow, SandboxValues } from "@/types/sandboxes";
import { useActions } from "@/utils/useAction";

/** What its .query file passes in: the workspace, where the form stands, the links, and the actions that change it. */
export interface SandboxesIndexPageProps {
  /** The project the page is under, for the breadcrumbs and the "Selected" card. */
  project: CurrentProject;
  /** The picker's label, "parent/child" for a sandbox. */
  projectLabel: string;
  /** Where loading the workspace stands. Left out, it is ready. */
  status?: ResourceStatus;
  /** The top of the workspace the viewer can open: the project, or a sandbox when that's all they're in. Null until it loads. */
  root: SandboxRow | null;
  /** Whether `root` is a sandbox, so it isn't "Main". */
  rootIsSandbox: boolean;
  /** Every sandbox below `root` the viewer is in, live and scheduled for deletion, by name. */
  sandboxes: SandboxRow[];
  /** Whether the viewer may make a sandbox under `project`; off, New sandbox says why. */
  canCreateSandbox: boolean;
  /** Why the plan allows no more sandboxes, or null. It stops New sandbox and Restore. */
  sandboxLimit: string | null;
  /** Days a deleted sandbox is kept before it's purged. */
  gracePeriodDays: number;
  /** Where New sandbox goes; it opens the form over the list. */
  createHref: string;
  /** A project's workflows, which its card opens. */
  workflowsHref: (id: string) => string;
  /** Where a sandbox's Edit goes; it opens the form over the list. */
  editHref: (id: string) => string;
  /** Whether the New sandbox form is open. */
  creating: boolean;
  /** The sandbox whose Edit form is open, or null. The form opens once it's among `sandboxes`. */
  editingId: string | null;
  /** Closes the form, back to the list. */
  onClose: () => void;
  /** Makes a sandbox under `project` and goes into it. Rejects with field errors keyed as the API keys them (`name`), or a message. */
  onCreate: (values: SandboxValues) => Promise<void>;
  /** Renames and recolours a sandbox. Rejects as `onCreate` does. */
  onUpdate: (sandbox: SandboxRow, values: SandboxValues) => Promise<void>;
  /** Schedules a sandbox, and every sandbox below it, for deletion. When that takes `project`, the host leaves for the sandbox's parent first. */
  onDelete: (sandbox: SandboxRow) => Promise<void>;
  /** Restores a sandbox scheduled for deletion, and the ones below it. */
  onCancelDeletion: (id: string) => Promise<void>;
  /** What merging a sandbox into `targetId` would do. */
  onPreviewMerge: (sandbox: SandboxRow, targetId: string) => Promise<MergePreviewResult>;
  /** Merges a sandbox, which schedules it for deletion, and goes to the target's workflows. */
  onMerge: (sandbox: SandboxRow, values: MergeValues) => Promise<void>;
}

/**
 * Inventory view `sandboxes-index` (SandboxLive.Index): the workspace's
 * projects as cards, with the New / Edit sandbox form over the list, and
 * Merge and Delete behind dialogs. A sandbox scheduled for deletion can be
 * restored from its card.
 */
export default function SandboxesIndexPage({
  project,
  projectLabel,
  status,
  root,
  rootIsSandbox,
  sandboxes,
  canCreateSandbox,
  sandboxLimit,
  gracePeriodDays,
  createHref,
  workflowsHref,
  editHref,
  creating,
  editingId,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onCancelDeletion,
  onPreviewMerge,
  onMerge,
}: SandboxesIndexPageProps) {
  const toast = useToast();
  // Where focus goes once a deleted or restored card has moved to another section, taking its button with it.
  const newSandbox = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const refocus = () => requestAnimationFrame(() => newSandbox.current?.focus());
  // Ids, not rows, so a dialog always shows the latest row and closes if it goes.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const live = (id: string | null) => sandboxes.find((s) => s.id === id && !s.scheduledDeletion);
  const deleting = live(deletingId);
  const merging = live(mergingId);
  const editing = live(editingId);
  const current = [root, ...sandboxes].find((s) => s?.id === project.id);
  const restore = useActions(
    async (_id: string, sandbox: SandboxRow) => {
      await onCancelDeletion(sandbox.id);
      toast(`Cancelled deletion of sandbox ${sandbox.name}.`);
      refocus();
    },
    { onError: "toast" }
  );
  const createBlocked = !canCreateSandbox ? "You are not authorized to create sandboxes in this workspace" : sandboxLimit;

  return (
    <ListPage
      title="Sandboxes"
      breadcrumbs={<ProjectBreadcrumbs project={project} label={projectLabel} current="Sandboxes" />}
      description="Isolated copies of this project for trying out changes before merging them back."
      actions={
        <Button ref={newSandbox} id="create-sandbox-button" icon="hero-plus" to={createHref} disabled={createBlocked !== null} tooltip={createBlocked ?? undefined}>
          New sandbox
        </Button>
      }
      status={status}
      // The workspace's top project is always listed, so the list is never empty; "No other sandboxes" sits in Active.
      itemCount={root ? 1 + sandboxes.length : 0}
      empty={{ icon: "hero-beaker", message: "No other sandboxes" }}
      list={
        root && (
          <WorkspaceList
            root={root}
            rootIsSandbox={rootIsSandbox}
            sandboxes={sandboxes}
            currentProjectId={project.id}
            workflowsHref={workflowsHref}
            editHref={editHref}
            restoreBlockedReason={sandboxLimit}
            restoring={restore.pending}
            onMerge={(s) => setMergingId(s.id)}
            onDelete={(s) => setDeletingId(s.id)}
            onRestore={(s) => void restore.run(s.id, s)}
          />
        )
      }
    >
      {(creating || editing) && current && (
        <SandboxFormModal
          key={editing?.id ?? "new"}
          sandbox={editing}
          parent={{ name: current.name, isSandbox: project.parentId !== null }}
          initialColor={sandboxColorPalette[sandboxes.length % sandboxColorPalette.length]!}
          onClose={onClose}
          onSave={async (values) => {
            if (editing) {
              await onUpdate(editing, values);
              onClose();
              toast("Sandbox updated");
            } else {
              await onCreate(values);
              toast(`Created a sandbox from ${current.name}.`);
            }
          }}
        />
      )}
      {deleting && (
        <DeleteSandboxModal
          key={deleting.id}
          sandboxName={deleting.name}
          descendantCount={deleting.descendantCount}
          isCurrent={deleting.holdsCurrent}
          rootName={deleting.parentName ?? ""}
          gracePeriodDays={gracePeriodDays}
          onClose={() => setDeletingId(null)}
          onConfirm={async () => {
            await onDelete(deleting);
            setDeletingId(null);
            toast(`Sandbox ${deleting.name} scheduled for deletion.`);
            refocus();
          }}
        />
      )}
      {merging && (
        <MergeSandboxModal
          key={merging.id}
          sandbox={merging}
          gracePeriodDays={gracePeriodDays}
          onPreview={(targetId) => onPreviewMerge(merging, targetId)}
          onClose={() => setMergingId(null)}
          onMerge={async (values) => {
            await onMerge(merging, values);
            const target = merging.mergeTargets.find((t) => t.id === values.targetId)?.name;
            toast(`Merged ${merging.name} into ${target}. Sandbox scheduled for deletion.`);
          }}
        />
      )}
    </ListPage>
  );
}

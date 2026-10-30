import type { SandboxRow } from "../../../types/sandboxes";
import { useAction } from "../../../utils/useAction";
import Button from "../../primitives/Button";
import IconButton from "../../primitives/IconButton";
import BranchesIcon from "./BranchesIcon";

/**
 * The icon buttons on a sandbox card (SandboxLive.Components.sandbox_actions):
 * Merge, Edit and Delete, greyed with a "not authorized" tooltip when the
 * user can't. A sandbox scheduled for deletion gets a Restore button instead,
 * greyed when the user can't or the plan's limit blocks it.
 */
export default function SandboxActions({
  sandbox,
  onMerge,
  onEdit,
  onDelete,
  onRestore,
}: {
  sandbox: SandboxRow;
  onMerge?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onDelete?: (() => void) | undefined;
  /** Restore spins while this is out, and a rejection's message toasts. Each card has its own, so two rows can restore at once. */
  onRestore?: (() => Promise<void>) | undefined;
}) {
  const restore = useAction(
    async () => {
      await onRestore?.();
    },
    { onError: "toast" },
  );
  if (sandbox.scheduledDeletion) {
    const blocked = sandbox.canCancelDeletion
      ? (sandbox.restoreBlockedReason ?? undefined)
      : "You are not authorized to cancel deletion of this sandbox";
    return (
      <div id={`cancel-deletion-sandbox-${sandbox.id}`}>
        <Button variant="secondary" disabled={!!blocked} tooltip={blocked} pending={restore.pending} onClick={() => void restore.run()}>
          Restore
        </Button>
      </div>
    );
  }
  const mergeLabel = sandbox.canMerge ? "Merge this sandbox" : "You are not authorized to merge this sandbox";
  return (
    <div className="flex gap-1">
      <span id={`branch-rewire-sandbox-${sandbox.id}`}>
        <IconButton
          icon={<BranchesIcon className="h-5 w-5" />}
          label={mergeLabel}
          disabled={!sandbox.canMerge}
          onClick={onMerge}
        />
      </span>
      <span id={`edit-sandbox-${sandbox.id}`}>
        <IconButton
          icon="hero-pencil-square"
          label={sandbox.canEdit ? "Edit this sandbox" : "You are not authorized to edit this sandbox"}
          disabled={!sandbox.canEdit}
          onClick={onEdit}
        />
      </span>
      <span id={`delete-sandbox-${sandbox.id}`}>
        <IconButton
          icon="hero-trash"
          label={sandbox.canDelete ? "Delete this sandbox" : "You are not authorized to delete this sandbox"}
          disabled={!sandbox.canDelete}
          onClick={onDelete}
        />
      </span>
    </div>
  );
}

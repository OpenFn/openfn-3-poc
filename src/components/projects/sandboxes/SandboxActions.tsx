import type { SandboxRow } from "@/types/sandboxes";
import Button from "@/components/primitives/Button";
import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuItem } from "@/components/primitives/Menu";

/**
 * What a sandbox's card offers: one ••• menu with Edit, Merge and Delete,
 * each greyed with Lightning's reason when the viewer can't; or, once the
 * sandbox is scheduled for deletion, Restore.
 */
export default function SandboxActions({
  sandbox,
  editHref,
  restoreBlockedReason,
  restoring,
  onMerge,
  onDelete,
  onRestore,
}: {
  sandbox: SandboxRow;
  editHref: string;
  /** Why the plan stops a restore, or null. */
  restoreBlockedReason: string | null;
  restoring: boolean;
  onMerge: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  if (sandbox.scheduledDeletion) {
    const blocked = sandbox.canCancelDeletion ? restoreBlockedReason : "You are not authorized to cancel deletion of this sandbox";
    return (
      <Button variant="secondary" disabled={blocked !== null} tooltip={blocked ?? undefined} pending={restoring} onClick={onRestore}>
        Restore
      </Button>
    );
  }
  const reason = (can: boolean, action: string) => (can ? undefined : `You are not authorized to ${action} this sandbox`);
  return (
    <Menu trigger={<IconButton icon="hero-ellipsis-horizontal" label={`Actions for ${sandbox.name}`} />}>
      <MenuItem to={editHref} disabled={!sandbox.canEdit} description={reason(sandbox.canEdit, "edit")}>
        Edit
      </MenuItem>
      <MenuItem onClick={onMerge} disabled={!sandbox.canMerge} description={reason(sandbox.canMerge, "merge")}>
        Merge
      </MenuItem>
      <MenuItem tone="danger" onClick={onDelete} disabled={!sandbox.canDelete} description={reason(sandbox.canDelete, "delete")}>
        Delete
      </MenuItem>
    </Menu>
  );
}

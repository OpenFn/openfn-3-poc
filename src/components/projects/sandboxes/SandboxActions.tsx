import type { SandboxRow } from "@/types/sandboxes";
import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuItem } from "@/components/primitives/Menu";

/** A live sandbox's ••• menu: Edit, Merge and Delete, each greyed with Lightning's reason when the viewer can't. */
export default function SandboxActions({
  sandbox,
  editHref,
  onMerge,
  onDelete,
}: {
  sandbox: SandboxRow;
  editHref: string;
  onMerge: () => void;
  onDelete: () => void;
}) {
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

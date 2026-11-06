import type { ReactNode } from "react";
import IconButton from "./IconButton";
import Menu, { MenuDivider, MenuItem } from "./Menu";

interface Props {
  /** The row's name; the button reads "Actions for <name>". */
  name: string;
  /** The row's actions, as `MenuItem`s. */
  children: ReactNode;
  onDelete: () => void;
  /** Delete's words when they aren't "Delete", e.g. "Delete now". */
  deleteLabel?: string | undefined;
  pending?: boolean;
}

/** A table row's ••• menu: its actions, then Delete, red and last, after a divider. */
export default function RowMenu({ name, children, onDelete, deleteLabel = "Delete", pending = false }: Props) {
  return (
    <Menu trigger={<IconButton icon="hero-ellipsis-horizontal" label={`Actions for ${name}`} pending={pending} />}>
      {children}
      <MenuDivider />
      <MenuItem icon="hero-trash" tone="danger" onClick={onDelete}>
        {deleteLabel}
      </MenuItem>
    </Menu>
  );
}

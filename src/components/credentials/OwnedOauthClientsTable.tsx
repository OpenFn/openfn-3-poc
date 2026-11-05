import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuDivider, MenuItem } from "@/components/primitives/Menu";
import Pill from "@/components/primitives/Pill";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";
import type { OauthClientRow } from "@/types/credentials";

interface Props {
  clients: OauthClientRow[];
  onEdit: (client: OauthClientRow) => void;
  onDelete: (client: OauthClientRow) => void;
}

/**
 * Your OAuth clients and the global ones: name, who can use it (every
 * project when it's global) and where people sign in, with a ⋮ menu on the
 * ones you own.
 */
export default function OwnedOauthClientsTable({ clients, onEdit, onDelete }: Props) {
  return (
    <Table
      header={
        <Tr>
          <Th>Name</Th>
          <Th>Projects with access</Th>
          <Th>Authorization URL</Th>
          <Th actions />
        </Tr>
      }
    >
      {clients.map((c) => (
        <Tr key={c.id}>
          <Td truncate maxWidth={60}>
            <Text tone="strong">{c.name}</Text>
          </Td>
          <Td wrap maxWidth={80}>
            {c.global ? (
              <Pill tone="info" variant="square">
                Global
              </Pill>
            ) : c.projects.length ? (
              c.projects.map((p) => p.name).join(", ")
            ) : (
              <Text tone="faint">None</Text>
            )}
          </Td>
          <Td truncate maxWidth={72}>
            <Text variant="code-sm">{c.authorizationEndpoint}</Text>
          </Td>
          <Td actions>
            {c.canEdit && (
              <Menu trigger={<IconButton icon="hero-ellipsis-vertical" label={`Actions for ${c.name}`} />}>
                <MenuItem icon="hero-pencil" onClick={() => onEdit(c)}>
                  Edit
                </MenuItem>
                <MenuDivider />
                <MenuItem icon="hero-trash" tone="danger" onClick={() => onDelete(c)}>
                  Delete
                </MenuItem>
              </Menu>
            )}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

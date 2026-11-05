import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuDivider, MenuItem } from "@/components/primitives/Menu";
import Pill from "@/components/primitives/Pill";
import { Row, Stack } from "@/components/primitives/Stack";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";
import type { CredentialRow } from "@/types/credentials";
import { formatCredentialType } from "@/utils/format";

interface Props {
  credentials: CredentialRow[];
  onEdit: (credential: CredentialRow) => void;
  /** Starts a transfer, or revokes a pending one. */
  onTransfer: (credential: CredentialRow) => void;
  onCancelDeletion: (credential: CredentialRow) => void;
  /** Schedules the deletion, or for a scheduled one deletes it now. */
  onDelete: (credential: CredentialRow) => void;
  /** The credential whose cancel is waiting on the server; its menu spins and the others wait. */
  pendingId: string | null;
}

/**
 * The credentials you own: name (and external ID), type, the projects that
 * can use it and its environments, with a ⋮ menu per row. A scheduled
 * credential offers only Cancel deletion and Delete now, since every other
 * action is refused until the deletion is cancelled.
 */
export default function OwnedCredentialsTable({ credentials, onEdit, onTransfer, onCancelDeletion, onDelete, pendingId }: Props) {
  return (
    <Table
      header={
        <Tr>
          <Th>Name</Th>
          <Th>Type</Th>
          <Th>Projects with access</Th>
          <Th>Environments</Th>
          <Th actions />
        </Tr>
      }
    >
      {credentials.map((c) => (
        <Tr key={c.id}>
          {/* A block, as in his design: the name wraps beside its badges. */}
          <Td wrap maxWidth={80}>
            <Stack gap="xs">
              <Row gap="sm" wrap>
                <Text tone="strong">{c.name}</Text>
                {c.transferStatus === "pending" && (
                  <Pill tone="warning" variant="square">
                    Transfer pending
                  </Pill>
                )}
                {c.scheduledDeletion && (
                  <Pill tone="danger" variant="square">
                    Scheduled for deletion
                  </Pill>
                )}
              </Row>
              {c.externalId && (
                <Text variant="code-sm" tone="faint">
                  {c.externalId}
                </Text>
              )}
            </Stack>
          </Td>
          <Td truncate maxWidth={40}>
            {formatCredentialType(c)}
          </Td>
          {/* Plain text, so a long project name wraps instead of pushing the table wide. */}
          <Td wrap maxWidth={80}>
            {c.projects.length ? c.projects.map((p) => p.name).join(", ") : <Text tone="faint">None</Text>}
          </Td>
          <Td>
            <Row gap="sm" wrap>
              {c.environments.map((name) => (
                <Pill key={name} variant="square">
                  {name}
                </Pill>
              ))}
            </Row>
          </Td>
          <Td actions>
            <Menu
              trigger={<IconButton icon="hero-ellipsis-vertical" label={`Actions for ${c.name}`} pending={pendingId === c.id} disabled={pendingId !== null && pendingId !== c.id} />}
            >
              {c.scheduledDeletion ? (
                <MenuItem icon="hero-arrow-uturn-left" onClick={() => onCancelDeletion(c)}>
                  Cancel deletion
                </MenuItem>
              ) : (
                <>
                  <MenuItem
                    icon="hero-pencil"
                    onClick={() => onEdit(c)}
                    disabled={c.schema === "oauth"}
                    description={c.schema === "oauth" ? "OAuth credentials can't be edited here yet." : undefined}
                  >
                    Edit
                  </MenuItem>
                  <MenuItem icon="hero-arrows-right-left" onClick={() => onTransfer(c)}>
                    {c.transferStatus === "pending" ? "Revoke transfer" : "Transfer"}
                  </MenuItem>
                </>
              )}
              <MenuDivider />
              <MenuItem icon="hero-trash" tone="danger" onClick={() => onDelete(c)}>
                {c.scheduledDeletion ? "Delete now" : "Delete"}
              </MenuItem>
            </Menu>
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

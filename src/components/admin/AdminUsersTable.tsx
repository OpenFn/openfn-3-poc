import type { AdminUserListRow, AdminUserSortKey } from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import { formatUtcDate, fullName } from "@/utils/format";
import { serverSortThProps } from "@/utils/useTableSort";
import Button from "@/components/primitives/Button";
import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuItem } from "@/components/primitives/Menu";
import Pagination from "@/components/primitives/Pagination";
import Pill from "@/components/primitives/Pill";
import { Row } from "@/components/primitives/Stack";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";

interface Props {
  users: AdminUserListRow[];
  page: PageLinks;
  /** The signed-in superuser, whose row says "(you)" and why its Delete is disabled. */
  currentUserId: string;
  /** The order the server listed `users` in. */
  sort: SortState<AdminUserSortKey>;
  onSort: (sort: SortState<AdminUserSortKey>) => void;
  editHref: (id: string) => string;
  deleteHref: (id: string) => string;
  onCancelDeletion: (id: string) => void;
  /** Whether this user's Cancel deletion is waiting on the server. */
  cancelling: (id: string) => boolean;
}

/** Every account on the instance, a page at a time. Delete now stays disabled until the API can purge a user. */
export default function AdminUsersTable({ users, page, currentUserId, sort, onSort, editHref, deleteHref, onCancelDeletion, cancelling }: Props) {
  const thProps = serverSortThProps(sort, onSort);

  return (
    <Table
      header={
        <Tr>
          <Th {...thProps("first_name")}>Name</Th>
          <Th {...thProps("role")}>Role</Th>
          <Th {...thProps("disabled")}>Status</Th>
          <Th actions />
        </Tr>
      }
      footer={<Pagination page={page} />}
    >
      {users.map((user) => {
        const name = fullName(user);
        const you = user.id === currentUserId;
        return (
          <Tr key={user.id} id={`user-row-${user.id}`}>
            <Td wrap maxWidth={80}>
              <Text tone="strong">{name}</Text>
              {you && " (you)"}
              <Text as="div" variant="body-sm">
                {user.email}
              </Text>
            </Td>
            <Td>
              <Row wrap>
                {user.role === "superuser" ? <Pill color="indigo">Superuser</Pill> : <Pill color="gray">User</Pill>}
                {user.supportUser && <Pill color="pink">Support</Pill>}
              </Row>
            </Td>
            <Td>
              <Row wrap>
                {user.disabled ? <Pill tone="neutral">Disabled</Pill> : <Pill tone="success">Enabled</Pill>}
                {user.scheduledDeletion && <Pill tone="danger">Deletes {formatUtcDate(user.scheduledDeletion)}</Pill>}
              </Row>
            </Td>
            <Td actions>
              <Button variant="secondary" size="xs" aria-label={`Edit ${name}`} to={editHref(user.id)}>
                Edit
              </Button>
              {user.scheduledDeletion ? (
                <>
                  <Button
                    variant="secondary"
                    size="xs"
                    aria-label={`Cancel deletion of ${name}`}
                    pending={cancelling(user.id)}
                    onClick={() => onCancelDeletion(user.id)}
                  >
                    Cancel deletion
                  </Button>
                  <Menu trigger={<IconButton icon="hero-ellipsis-horizontal" label={`More actions for ${name}`} />}>
                    <MenuItem disabled description="Not available in the API yet">
                      Delete now
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="xs"
                  aria-label={`Delete ${name}`}
                  to={deleteHref(user.id)}
                  disabled={!user.canDelete}
                  tooltip={user.canDelete ? undefined : you ? "You can't delete your own account" : "Superusers can't be deleted"}
                >
                  Delete
                </Button>
              )}
            </Td>
          </Tr>
        );
      })}
    </Table>
  );
}

import ListPage from "@/components/patterns/ListPage";
import Button from "@/components/primitives/Button";
import { Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import { useToast } from "@/components/primitives/Toast";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import ListSearch from "@/components/admin/ListSearch";
import UserDeletionModal from "@/components/domain/UserDeletionModal";
import type { AdminUserListRow, AdminUserSortKey } from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { useActions } from "@/utils/useAction";

/** What its .query file passes in: data, the open dialog, and the actions that change it. */
export interface AdminUsersPageProps {
  /** Where loading the users stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** One page of every account on the instance, as the server searched, sorted and paged it. */
  users: AdminUserListRow[];
  /** The page shown (`?page=`); the table links to the others. */
  page: PageLinks;
  /** The signed-in superuser, whose row says "(you)" and why its Delete is disabled. */
  currentUserId: string;
  /** The search the list was loaded with (`?q=`). */
  search: string;
  /** Asks for the list with another search. */
  onSearch: (search: string) => void;
  /** The order `users` came in. */
  sort: SortState<AdminUserSortKey>;
  /** Asks for another order. */
  onSort: (sort: SortState<AdminUserSortKey>) => void;
  /** Where New user goes. */
  createHref: string;
  /** Where a user's Edit goes. */
  editHref: (id: string) => string;
  /** Where a user's Delete goes; it opens the deletion dialog over the list. */
  deleteHref: (id: string) => string;
  /** The user whose deletion dialog is open, or null. */
  deleting: AdminUserListRow | null;
  /** Closes the dialog, back to the list. */
  onClose: () => void;
  /** Schedules a user's deletion, which disables them. */
  onScheduleDeletion: (id: string) => Promise<void>;
  /** Cancels a user's scheduled deletion, which enables them again. */
  onCancelDeletion: (id: string) => Promise<void>;
}

/**
 * Inventory view `admin-users` (UserLive.Index): every account on the
 * instance, searched, sorted and paged by the server, with the deletion
 * dialog over it.
 */
export default function AdminUsersPage({
  status,
  users,
  page,
  currentUserId,
  search,
  onSearch,
  sort,
  onSort,
  createHref,
  editHref,
  deleteHref,
  deleting,
  onClose,
  onScheduleDeletion,
  onCancelDeletion,
}: AdminUsersPageProps) {
  const toast = useToast();
  const cancel = useActions(
    async (id: string) => {
      await onCancelDeletion(id);
      toast("User deletion canceled");
    },
    { onError: "toast" }
  );

  return (
    <ListPage
      title="Users"
      description="Every account on this instance. Adding people to a project and changing their role there is usually done by the project's admins, in its settings."
      actions={
        <>
          <ListSearch value={search} onSearch={onSearch} placeholder="Filter users" />
          <Button to={createHref} icon="hero-user-plus">
            New user
          </Button>
        </>
      }
      status={status}
      itemCount={users.length}
      empty={{ icon: "hero-users", message: "No users match." }}
      list={
        <Stack>
          <AdminUsersTable
            users={users}
            page={page}
            currentUserId={currentUserId}
            sort={sort}
            onSort={onSort}
            editHref={editHref}
            deleteHref={deleteHref}
            onCancelDeletion={(id) => void cancel.run(id)}
            cancelling={cancel.pending}
          />
          <Text as="p" tone="muted" variant="body-sm">
            A superuser can reach everything on this instance, across every project, including these settings.
          </Text>
        </Stack>
      }
    >
      {deleting && (
        <UserDeletionModal
          key={deleting.id}
          email={deleting.email}
          hasActivityInProjects={deleting.hasActivityInProjects}
          onClose={onClose}
          onDelete={async () => {
            await onScheduleDeletion(deleting.id);
            onClose();
            toast("User scheduled for deletion");
          }}
        />
      )}
    </ListPage>
  );
}

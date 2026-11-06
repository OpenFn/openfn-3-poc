import { superuserReach } from "@/constants";
import ListPage from "@/components/patterns/ListPage";
import Button from "@/components/primitives/Button";
import { Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import { useToast } from "@/components/primitives/Toast";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import ListSearch from "@/components/admin/ListSearch";
import UserFormModal from "@/components/admin/UserFormModal";
import UserDeletionModal from "@/components/domain/UserDeletionModal";
import type {
  AdminUserEditing,
  AdminUserListRow,
  AdminUserSortKey,
  UserFormValues,
} from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { useActions } from "@/utils/useAction";

/** What its .query file passes in: data, the open modal or dialog, and the actions that change it. */
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
  /** Where New user goes; it opens the New user form over the list. */
  createHref: string;
  /** Where a user's Edit goes; it opens their form over the list. */
  editHref: (id: string) => string;
  /** Where a user's Delete goes; it opens the deletion dialog over the list. */
  deleteHref: (id: string) => string;
  /** Whether the New user form is open. */
  creating: boolean;
  /** The user whose form is open, or null. */
  editing: AdminUserEditing | null;
  /** Your profile, where you change your own email and password. */
  profileHref: string;
  /** The user whose deletion dialog is open, or null. */
  deleting: AdminUserListRow | null;
  /** Closes the modal or dialog, back to the list. */
  onClose: () => void;
  /** Creates a user. Answers why support access wasn't turned on, if it was asked for and wasn't: the user exists without it. */
  onCreate: (
    values: Partial<UserFormValues>,
  ) => Promise<{ supportRefused: string | null }>;
  /** Changes only the fields given. */
  onUpdate: (id: string, changes: Partial<UserFormValues>) => Promise<void>;
  /** Schedules a user's deletion, which disables them. */
  onScheduleDeletion: (id: string) => Promise<void>;
  /** Cancels a user's scheduled deletion, which enables them again. */
  onCancelDeletion: (id: string) => Promise<void>;
}

/**
 * Inventory view `admin-users` (UserLive.Index): every account on the
 * instance, searched, sorted and paged by the server, with the user form and
 * the deletion dialog over it.
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
  creating,
  editing,
  profileHref,
  deleting,
  onClose,
  onCreate,
  onUpdate,
  onScheduleDeletion,
  onCancelDeletion,
}: AdminUsersPageProps) {
  const toast = useToast();
  const cancel = useActions(
    async (id: string) => {
      await onCancelDeletion(id);
      toast("User deletion canceled");
    },
    { onError: "toast" },
  );

  return (
    <ListPage
      title="Users"
      description="Every account on this instance. Adding people to a project and changing their role there is usually done by the project's admins, in its settings."
      search={
        <ListSearch
          value={search}
          onSearch={onSearch}
          placeholder="Filter users"
        />
      }
      actions={
        <Button to={createHref} icon="hero-user-plus">
          New user
        </Button>
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
            {superuserReach}
          </Text>
        </Stack>
      }
    >
      {creating && (
        <UserFormModal
          profileHref={profileHref}
          onCancel={onClose}
          onSave={async (values) => {
            const { supportRefused } = await onCreate(values);
            onClose();
            if (supportRefused)
              toast(
                `User created, but support access wasn't turned on. ${supportRefused}`,
                "danger",
              );
            else toast("User created successfully");
          }}
        />
      )}
      {editing && (
        <UserFormModal
          editing={editing}
          profileHref={profileHref}
          onCancel={onClose}
          onSave={async (changes) => {
            await onUpdate(editing.id, changes);
            onClose();
            toast("User updated successfully");
          }}
        />
      )}
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

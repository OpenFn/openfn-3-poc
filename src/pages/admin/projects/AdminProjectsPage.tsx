import ListPage from "@/components/patterns/ListPage";
import Button from "@/components/primitives/Button";
import { useToast } from "@/components/primitives/Toast";
import AdminProjectForm from "@/components/admin/AdminProjectForm";
import AdminProjectsTable from "@/components/admin/AdminProjectsTable";
import ListSearch from "@/components/admin/ListSearch";
import ProjectDeletionModal from "@/components/domain/ProjectDeletionModal";
import type {
  AdminProjectFormValues,
  AdminProjectRow,
  AdminProjectSortKey,
  AdminProjectUser,
} from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { useActions } from "@/utils/useAction";

/** What its .query file passes in: data, where each modal stands, and the actions that change it. */
export interface AdminProjectsPageProps {
  /** Where loading the projects stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** One page of every project on the instance, as the server searched, sorted and paged it. */
  projects: AdminProjectRow[];
  /** The page shown (`?page=`); the table links to the others. */
  page: PageLinks;
  /** The search the list was loaded with (`?q=`). */
  search: string;
  /** Asks for the list with another search. */
  onSearch: (search: string) => void;
  /** The order `projects` came in. */
  sort: SortState<AdminProjectSortKey>;
  /** Asks for another order. */
  onSort: (sort: SortState<AdminProjectSortKey>) => void;
  /** Where New project goes; it opens the New project modal over the list. */
  createHref: string;
  /** Where a project's Delete goes; it opens the deletion dialog over the list. */
  deleteHref: (id: string) => string;
  /** Whether the New project modal is open. */
  creating: boolean;
  /** Who the New project form can give a role to, loaded while it's open. */
  users: AdminProjectUser[];
  /** Where loading `users` stands. Left out, they are ready. */
  usersStatus?: ResourceStatus;
  /** The project whose deletion dialog is open, or null. */
  deleting: AdminProjectRow | null;
  /** Days until a scheduled project is purged. */
  gracePeriodDays: number;
  /** Closes the modal or dialog, back to the list. */
  onClose: () => void;
  /** Creates a project with exactly these members. */
  onCreate: (values: AdminProjectFormValues) => Promise<void>;
  /** Schedules a project for deletion. */
  onScheduleDeletion: (id: string) => Promise<void>;
  /** Cancels a project's scheduled deletion. */
  onCancelDeletion: (id: string) => Promise<void>;
}

/**
 * Inventory view `admin-projects` (ProjectLive.Index): every project on the
 * instance, searched, sorted and paged by the server, with the New project
 * modal and the deletion dialog over it.
 */
export default function AdminProjectsPage({
  status,
  projects,
  page,
  search,
  onSearch,
  sort,
  onSort,
  createHref,
  deleteHref,
  creating,
  users,
  usersStatus,
  deleting,
  gracePeriodDays,
  onClose,
  onCreate,
  onScheduleDeletion,
  onCancelDeletion,
}: AdminProjectsPageProps) {
  const toast = useToast();
  const cancel = useActions(
    async (id: string) => {
      await onCancelDeletion(id);
      toast("Project deletion canceled");
    },
    { onError: "toast" },
  );

  return (
    <ListPage
      title="Projects"
      description="Every project on this instance, whoever is in it."
      search={
        <ListSearch
          value={search}
          onSearch={onSearch}
          placeholder="Filter projects"
        />
      }
      actions={
        <Button to={createHref} icon="hero-folder-plus">
          New project
        </Button>
      }
      status={status}
      itemCount={projects.length}
      empty={{ icon: "hero-folder", message: "No projects match." }}
      list={
        <AdminProjectsTable
          projects={projects}
          page={page}
          sort={sort}
          onSort={onSort}
          deleteHref={deleteHref}
          onCancelDeletion={(id) => void cancel.run(id)}
          cancelling={cancel.pending}
        />
      }
    >
      {creating && (
        <AdminProjectForm
          users={users}
          status={usersStatus}
          onCancel={onClose}
          onSave={async (values) => {
            await onCreate(values);
            onClose();
            toast("Project created successfully");
          }}
        />
      )}
      {deleting && (
        <ProjectDeletionModal
          key={deleting.id}
          project={deleting}
          gracePeriodDays={gracePeriodDays}
          onCancel={onClose}
          onDelete={async () => {
            await onScheduleDeletion(deleting.id);
            onClose();
            toast("Project scheduled for deletion");
          }}
        />
      )}
    </ListPage>
  );
}

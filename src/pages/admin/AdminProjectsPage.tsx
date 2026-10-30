import Button from "../../components/primitives/Button";
import Header from "../../components/primitives/Header";
import { Centered, PageContent } from "../../components/primitives/PageContent";
import AdminProjectForm from "../../components/admin/AdminProjectForm";
import AdminProjectsTable from "../../components/admin/AdminProjectsTable";
import ProjectDeletionModal from "../../components/domain/ProjectDeletionModal";
import type { AdminDeleteProject, AdminProjectForm as FormData, AdminProjectFormValues, AdminProjectRow } from "../../types/admin";
import { useAction } from "../../utils/useAction";

/** The contract between this page and whatever feeds it (the replica wrapper, later Lightning). */
export interface AdminProjectsPageProps {
  /** Every project on the instance; the page sorts and filters them. */
  projects: AdminProjectRow[];
  /** The form while the route has it open (/new, /:id); null on the list. */
  form: FormData | null;
  /** The project whose deletion dialog is open (/:id/delete); otherwise null. */
  deleteProject: AdminDeleteProject | null;
  /** Days until a scheduled project is purged; 0 means today. */
  gracePeriodDays: number;
  /** Saves the open form. Resolves when the host has it (it then returns to the list); rejects with field errors or a message. */
  onSave: (values: AdminProjectFormValues) => Promise<void>;
  /** Schedules the open dialog's project for deletion, or purges it now if already scheduled. Rejects with the reason, shown in the dialog. */
  onDelete: (nameConfirmation: string) => Promise<void>;
  /** Cancels a scheduled deletion. Rejects on failure, which the page toasts. */
  onCancelDeletion: (id: string) => Promise<void>;
  /** Closes the deletion dialog. */
  onClose: () => void;
  /** Where "New Project" goes. */
  newProjectHref: string;
  /** The projects list, where the form's Cancel goes. */
  cancelHref: string;
}

/**
 * Inventory view `admin-projects` (ProjectLive.Index): the table at
 * /settings/projects, the form at /new and /:id, the deletion dialog at
 * /:id/delete. Which one shows is the host's to say, through `form` and
 * `deleteProject`. Props only, so it can run unchanged in Lightning; the
 * replica's data and routing live in AdminProjectsPage.replica.tsx.
 */
export default function AdminProjectsPage({
  projects,
  form,
  deleteProject,
  gracePeriodDays,
  onSave,
  onDelete,
  onCancelDeletion,
  onClose,
  newProjectHref,
  cancelHref,
}: AdminProjectsPageProps) {
  const cancel = useAction(onCancelDeletion, { onError: "toast" });
  const title = form ? (form.project ? "Edit Project" : "New Project") : "Projects";

  return (
    <PageContent
      header={
        <Header title={title}>
          <Button to={newProjectHref} icon="hero-plus">
            New Project
          </Button>
        </Header>
      }
    >
      <Centered>
        {deleteProject && (
          <ProjectDeletionModal
            key={deleteProject.id}
            project={deleteProject}
            gracePeriodDays={gracePeriodDays}
            onCancel={onClose}
            onDelete={onDelete}
          />
        )}
        {form ? (
          <AdminProjectForm
            key={form.project?.id ?? "new"} project={form.project ?? undefined} users={form.users}
            onSave={onSave}
            cancelHref={cancelHref}
          />
        ) : (
          <AdminProjectsTable projects={projects} onCancelDeletion={(project) => void cancel.run(project.id)} />
        )}
      </Centered>
    </PageContent>
  );
}

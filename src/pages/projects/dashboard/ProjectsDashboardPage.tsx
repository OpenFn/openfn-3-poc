import { useState } from "react";
import ListPage from "@/components/templates/ListPage";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import ProjectsTable from "@/components/projects/ProjectsTable";
import WelcomeBanner from "@/components/projects/WelcomeBanner";
import { useToast } from "@/components/primitives/Toast";
import type { ResourceStatus } from "@/types/resource";
import type { ProjectOverview } from "@/types/workflows";

/** What the route passes in: data, the actions that change it, and who's looking. */
export interface ProjectsDashboardPageProps {
  /** Where loading the projects stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** The signed-in user's first name, for the greeting. */
  firstName: string;
  /** The user's projects with their counts, as the server lists them; the table sorts them. */
  projects: ProjectOverview[];
  /**
   * Creates a project. Rejects on failure; field errors keyed `rawName` and
   * `description` show on the form. The page announces success.
   */
  onCreate: (project: { name: string; description: string }) => Promise<void>;
}

/**
 * Inventory view `projects-dashboard` (DashboardLive.Index): the greeting,
 * the user's projects, and the Create project modal. The page owns how it
 * behaves (the modal, the toast); its route, ProjectsDashboardPage.route.tsx,
 * only passes data and actions.
 */
export default function ProjectsDashboardPage({ status, firstName, projects, onCreate }: ProjectsDashboardPageProps) {
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const create = async (project: { name: string; description: string }) => {
    await onCreate(project);
    toast("Project created successfully");
  };

  return (
    <ListPage
      title="Projects"
      showCount
      action={{ id: "open-create-project-modal-button", label: "Create project", onClick: () => setCreating(true) }}
      notice={<WelcomeBanner firstName={firstName} />}
      status={status}
      itemCount={projects.length}
      empty={{ icon: "hero-plus-circle", message: "No projects found.", actionLabel: "Create a new one." }}
      list={<ProjectsTable projects={projects} />}
    >
      <CreateProjectModal open={creating} onClose={() => setCreating(false)} onCreate={create} />
    </ListPage>
  );
}

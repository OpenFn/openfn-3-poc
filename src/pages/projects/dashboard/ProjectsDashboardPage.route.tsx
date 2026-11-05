import { useProjectOverviews } from "@/api/projects";
import { useCurrentUser } from "@/session/session";
import ProjectsDashboardPage from "./ProjectsDashboardPage";

/**
 * ProjectsDashboardPage's route: loads the projects from the API, with the
 * planned include=stats for their counts. It only passes data and actions;
 * the modal and the toast are the page's.
 */
export default function ProjectsDashboardPageRoute() {
  const { status, projects } = useProjectOverviews();
  const user = useCurrentUser();

  return (
    <ProjectsDashboardPage
      status={status}
      firstName={user.firstName}
      projects={projects}
      // ponytail: local only, the list doesn't change. Creating through PUT /api/projects/:id needs a
      // superuser's token today; call it here once any user may create a project (api/projects.md).
      onCreate={async () => {}}
    />
  );
}

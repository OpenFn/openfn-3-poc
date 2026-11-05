import { useProjectOverviews, useProjectSaves } from "@/api/projects";
import { useCurrentUser } from "@/session/session";
import ProjectsDashboardPage from "./ProjectsDashboardPage";

/**
 * ProjectsDashboardPage's .query file: loads the projects from the API, with the
 * planned include=stats for their counts, and creates them. It only passes data and actions;
 * the modal and the toast are the page's.
 */
export default function ProjectsDashboardPageRoute() {
  const { status, projects } = useProjectOverviews();
  const { create } = useProjectSaves();
  const user = useCurrentUser();

  return (
    <ProjectsDashboardPage
      status={status}
      firstName={user.firstName}
      projects={projects}
      onCreate={create}
    />
  );
}

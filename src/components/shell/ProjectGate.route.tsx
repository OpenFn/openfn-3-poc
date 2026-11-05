// eslint-disable-next-line no-restricted-imports -- wiring: the gate reads the project id from the URL and renders the route Outlet.
import { Outlet, useParams } from "react-router-dom";
import { useProject } from "@/api/projects";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";

/**
 * The parent of every /projects/:projectId route (Lightning's :project_scope,
 * annotations/shared/shared-project-scope.md). Loads the project once and
 * shows loading, Not Found or No Access itself; the page under it renders
 * only once the project is there, and reads it with useGatedProject.
 */
export default function ProjectGate() {
  const { projectId = "" } = useParams();
  const { status } = useProject(projectId);
  return (
    <AsyncBoundary status={status}>
      <Outlet />
    </AsyncBoundary>
  );
}

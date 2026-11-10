import { Navigate, Outlet, useParams } from "react-router-dom";
import { useProject, useRefusedForMfa } from "@/api/projects";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { useFocusMainAfterSwap } from "@/utils/useFocusMainAfterSwap";

/**
 * The parent of every /projects/:projectId route (Lightning's :project_scope,
 * annotations/shared/shared-project-scope.md). Loads the project once and
 * shows loading, Not Found or No Access itself, or sends a member who hasn't
 * set up MFA to /mfa_required when the project requires it. The page under
 * it renders only once the project is there, and reads it with useCurrentProject (src/api/projects.ts), never
 * checking that it exists.
 */
export default function ProjectGate() {
  const { projectId = "" } = useParams();
  const { status: loaded } = useProject(projectId);
  const mfa = useRefusedForMfa(projectId, loaded.state === "forbidden");
  // Keep the spinner up while finding out which refusal it is, so No Access doesn't flash first.
  const status = mfa === "checking" ? ({ state: "loading" } as const) : loaded;
  useFocusMainAfterSwap(status.state === "loading");
  if (mfa === true) return <Navigate to="/mfa_required" replace />;
  return (
    <AsyncBoundary status={status} titleAs="h1">
      {/* Switching project starts the page afresh, as Lightning's full page load does. */}
      <Outlet key={projectId} />
    </AsyncBoundary>
  );
}

import { Navigate, Outlet, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useProject, useRefusedForMfa } from "@/api/projects";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";

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
  // Opening another project swaps the page for the spinner, and with it the
  // picker button focus would return to. Once the new page (or Not Found) is
  // in, give focus to <main> (Layout) instead of leaving it on <body>
  // (WCAG 2.4.3). Not on the first load: nothing was swapped out then.
  const shown = useRef(false);
  const swapped = useRef(false);
  useEffect(() => {
    if (status.state === "loading") {
      if (shown.current) swapped.current = true;
      return;
    }
    if (swapped.current && document.activeElement === document.body) document.querySelector<HTMLElement>("main")?.focus();
    swapped.current = false;
    shown.current = true;
  }, [status.state]);
  if (mfa === true) return <Navigate to="/mfa_required" replace />;
  return (
    <AsyncBoundary status={status} titleAs="h1">
      <Outlet />
    </AsyncBoundary>
  );
}

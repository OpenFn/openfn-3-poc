// eslint-disable-next-line no-restricted-imports -- wiring: the gate reads the project id from the URL and renders the route Outlet.
import { Outlet, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useProject } from "@/api/projects";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";

/**
 * The parent of every /projects/:projectId route (Lightning's :project_scope,
 * annotations/shared/shared-project-scope.md). Loads the project once and
 * shows loading, Not Found or No Access itself; the page under it renders
 * only once the project is there, and reads it with useCurrentProject, never
 * checking that it exists.
 */
export default function ProjectGate() {
  const { projectId = "" } = useParams();
  const { status } = useProject(projectId);
  // Opening another project swaps the page for the spinner, and with it the
  // picker button focus would return to. Once the page (or Not Found) is in,
  // give focus to it instead of leaving it on <body> (WCAG 2.4.3).
  const wasLoading = useRef(false);
  useEffect(() => {
    if (status.state === "loading") wasLoading.current = true;
    else if (wasLoading.current) {
      wasLoading.current = false;
      if (document.activeElement === document.body) document.querySelector<HTMLElement>("main")?.focus();
    }
  }, [status.state]);
  return (
    <AsyncBoundary status={status} titleAs="h1">
      <Outlet />
    </AsyncBoundary>
  );
}

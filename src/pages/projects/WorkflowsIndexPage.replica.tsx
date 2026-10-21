import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useToast } from "../../components/Toast";
import { projectLabel } from "../../components/shell/projectPickerItems";
import { projectMetricsFor } from "../../utils/history";
import { workflowStatsFor } from "../../mock-data/dashboard-stats";
import { findProject, projects } from "../../mock-data/projects";
import { simulateRequest } from "../../mock-data/request";
import { permissionsFor } from "../../permissions";
import { useCurrentUser } from "../../session/session";
import { matchesQuery } from "../../utils/search";
import WorkflowsIndexPage from "./WorkflowsIndexPage";

/**
 * The replica's side of WorkflowsIndexPage: the project from the URL, the
 * fixtures joined and filtered as the server would, metrics summed from
 * them, and the success toasts. Toggle and delete only change local state.
 * Lightning replaces this file with a LiveView wrapper.
 */
export default function WorkflowsIndexPageReplica() {
  const { projectId } = useParams();
  const user = useCurrentUser();
  const project = findProject(projectId);
  const [search, setSearch] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [deleted, setDeleted] = useState<string[]>([]);
  const toast = useToast();

  if (!project) return <Navigate to="/projects" replace />;

  const { canCreateWorkflow, canDeleteWorkflow } = permissionsFor(project, user);
  const stats = workflowStatsFor(project.id)
    .filter((s) => !deleted.includes(s.workflow.id))
    .filter((s) => matchesQuery(search, s.workflow.name))
    .map((s) => ({ ...s, workflow: { ...s.workflow, enabled: enabled[s.workflow.id] ?? s.workflow.enabled } }));

  return (
    <WorkflowsIndexPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      period="last 30 days"
      stats={stats}
      metrics={projectMetricsFor(stats)}
      searchTerm={search}
      canCreateWorkflow={canCreateWorkflow}
      canDeleteWorkflow={canDeleteWorkflow}
      lifecycle={user.experimentalFeatures}
      onSearch={setSearch}
      onClear={() => setSearch("")}
      onToggle={async (id, v) => {
        await simulateRequest();
        setEnabled((m) => ({ ...m, [id]: v }));
        toast("Workflow updated");
      }}
      onDelete={async (id) => {
        await simulateRequest();
        setDeleted((d) => [...d, id]);
        toast("Workflow successfully deleted.");
      }}
    />
  );
}

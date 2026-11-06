import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { combinedStatus } from "@/api/client";
import { useCurrentProject, useProjectPermissions, useProjectSaves, useProjectTree } from "@/api/projects";
import { useMergePreview, useSandboxes, useSandboxLimit, useSandboxSaves } from "@/api/sandboxes";
import { usePurgeDeletedAfterDays } from "@/api/session";
import { projectLabel } from "@/components/shell/projectPickerItems";
import SandboxesIndexPage from "./SandboxesIndexPage";

/**
 * SandboxesIndexPage's query, under ProjectGate: the workspace from the API,
 * New sandbox's permission and limit from the project, each sandbox's from
 * its listing. /sandboxes/new for someone who can't make one, or an edit of
 * a sandbox that isn't listed or they can't edit, goes back to the list once
 * the list has loaded. Closing the form replaces the URL, so Back doesn't
 * reopen it. A new sandbox, and a merge, land on that project's workflows.
 */
export default function SandboxesIndexPageQuery() {
  const { projectId = "", sandboxId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const project = useCurrentProject(projectId);
  const can = useProjectPermissions(project.id);
  const { projects } = useProjectTree();
  const { status: workspaceStatus, workspace, rootIsSandbox } = useSandboxes(project.id);
  const limit = useSandboxLimit(project.id);
  const purge = usePurgeDeletedAfterDays();
  const saves = useSandboxSaves();
  const previewMerge = useMergePreview();
  const projectSaves = useProjectSaves();

  const [root = null, ...sandboxes] = workspace;
  const status = combinedStatus(workspaceStatus, purge.status);
  const isNew = pathname.endsWith("/new");
  const creating = isNew && can("provision_sandbox") && limit === null;
  const editingId = sandboxes.find((s) => s.id === sandboxId && s.canEdit && !s.scheduledDeletion)?.id ?? null;
  const leave = (isNew || sandboxId !== undefined) && status.state === "ready" && !creating && editingId === null;

  const listHref = `/projects/${project.id}/sandboxes`;
  const workflowsHref = (id: string) => `/projects/${id}/w`;

  return (
    <>
      {leave && <Navigate to={listHref} replace />}
      <SandboxesIndexPage
        project={project}
        projectLabel={projectLabel(project, projects)}
        status={status}
        root={root}
        rootIsSandbox={rootIsSandbox}
        sandboxes={sandboxes}
        canCreateSandbox={can("provision_sandbox")}
        sandboxLimit={limit}
        gracePeriodDays={purge.days}
        createHref={`${listHref}/new`}
        workflowsHref={workflowsHref}
        editHref={(id) => `${listHref}/${id}/edit`}
        creating={creating}
        editingId={editingId}
        onClose={() => navigate(listHref, { replace: true })}
        onCreate={async (values) => navigate(workflowsHref(await saves.create(project.id, values)))}
        onUpdate={saves.update}
        onDelete={(sandbox) =>
          projectSaves.scheduleDeletion(sandbox.id, sandbox.holdsCurrent ? () => navigate(`/projects/${sandbox.parentId}/sandboxes`, { replace: true }) : undefined)
        }
        onCancelDeletion={projectSaves.cancelDeletion}
        onPreviewMerge={previewMerge}
        onMerge={(sandbox, values) => saves.merge(sandbox, values, () => navigate(workflowsHref(values.targetId)))}
      />
    </>
  );
}

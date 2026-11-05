import { Navigate, useParams } from "react-router-dom";
import { useWorkflows } from "@/api/workflows";
import { projectLabel } from "@/components/shell/projectPickerItems";
// debt: the project comes from the fixtures until PR 12's useGatedProject lands (F09).
import { findProject, projects } from "@/mock-data/projects";
import { permissionsFor } from "@/permissions";
import { useCurrentUser } from "@/session/session";
import { useUrlParams } from "@/utils/useUrlParams";
import type { SortState } from "@/types/lists";
import WorkflowsIndexPage from "./WorkflowsIndexPage";

const SORTS = ["name", "updated_at", "last_work_order_updated_at"];

/**
 * WorkflowsIndexPage's route: the project's workflows from the API, in the
 * order `?sort` and `?dir` ask for (the server sorts). It only passes data
 * and actions.
 */
export default function WorkflowsIndexPageRoute() {
  const { projectId = "" } = useParams();
  const { params, update } = useUrlParams<"sort" | "dir">();
  const sort: SortState = {
    key: params.sort && SORTS.includes(params.sort) ? params.sort : "name",
    direction: params.dir === "desc" ? "desc" : "asc",
  };
  const { status, workflows } = useWorkflows(projectId, sort);
  const user = useCurrentUser();
  const project = findProject(projectId);
  if (!project) return <Navigate to="/projects" replace />;

  return (
    <WorkflowsIndexPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      status={status}
      workflows={workflows}
      sort={sort}
      onSort={(next) => update({ sort: next.key, dir: next.direction })}
      canCreateWorkflow={permissionsFor(project, user).canCreateWorkflow}
    />
  );
}

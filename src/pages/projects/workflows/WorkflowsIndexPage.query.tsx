import { useParams } from "react-router-dom";
import { useCurrentProject, useProjectPermissions, useProjectTree } from "@/api/projects";
import { isWorkflowSortKey, useWorkflows } from "@/api/workflows";
import { projectLabel } from "@/components/shell/projectPickerItems";
import { useUrlParams } from "@/utils/useUrlParams";
import type { SortState } from "@/types/lists";
import type { WorkflowSortKey } from "@/types/workflows";
import WorkflowsIndexPage from "./WorkflowsIndexPage";

/**
 * WorkflowsIndexPage's query, under ProjectGate: the project's workflows from
 * the API, in the order `?sort` and `?dir` ask for (the server sorts), and
 * Create from the project's planned `permissions`. It only passes data and actions.
 */
export default function WorkflowsIndexPageQuery() {
  const { projectId = "" } = useParams();
  const project = useCurrentProject(projectId);
  const can = useProjectPermissions(project.id);
  // The shell's picker already loads the tree, so the sandbox label costs no request.
  const { projects } = useProjectTree();
  const { params, update } = useUrlParams<"sort" | "dir">();
  const sort: SortState<WorkflowSortKey> = {
    key: isWorkflowSortKey(params.sort) ? params.sort : "name",
    direction: params.dir === "desc" ? "desc" : "asc",
  };
  const { status, workflows } = useWorkflows(project.id, sort);

  return (
    <WorkflowsIndexPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      status={status}
      workflows={workflows}
      sort={sort}
      onSort={(next) => update({ sort: next.key, dir: next.direction })}
      canCreateWorkflow={can("create_workflow")}
    />
  );
}

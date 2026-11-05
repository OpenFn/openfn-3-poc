import Button from "@/components/primitives/Button";
import ListPage from "@/components/templates/ListPage";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import ProjectWorkflowsTable from "@/components/projects/ProjectWorkflowsTable";
import type { CurrentProject } from "@/types/projects";
import type { SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import type { WorkflowListItem } from "@/types/workflows";

/** What the route passes in: data, the actions that change it, and who's looking. */
export interface WorkflowsIndexPageProps {
  project: CurrentProject;
  /** The picker's label, "parent/child" for a sandbox. */
  projectLabel: string;
  /** Where loading the workflows stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** The project's workflows, in the order the server sorted them. */
  workflows: WorkflowListItem[];
  /** The order `workflows` came in. */
  sort: SortState;
  /** Asks for another order; the route puts it in the URL and the server sorts. */
  onSort: (sort: SortState) => void;
  canCreateWorkflow: boolean;
}

/**
 * Inventory view `workflows-index` (WorkflowLive.Index), on Brandon's design:
 * the project's workflows with their latest run and last update, and Create
 * new workflow. Search, the metric cards, the on/off switch and delete are
 * left out (D40, D45).
 */
export default function WorkflowsIndexPage({
  project,
  projectLabel,
  status,
  workflows,
  sort,
  onSort,
  canCreateWorkflow,
}: WorkflowsIndexPageProps) {
  return (
    <ListPage
      title="Workflows"
      showCount
      breadcrumbs={<ProjectBreadcrumbs project={project} label={projectLabel} current="Workflows" />}
      description="Workflows move data between your connected systems."
      actions={
        <Button
          id="new-workflow-button"
          to={`/projects/${project.id}/w/new`}
          disabled={!canCreateWorkflow}
          tooltip={canCreateWorkflow ? undefined : "You are not authorized to perform this action."}
        >
          Create new workflow
        </Button>
      }
      status={status}
      itemCount={workflows.length}
      empty={{ icon: "hero-square-3-stack-3d", message: "No workflows found. Create one to start automating." }}
      list={<ProjectWorkflowsTable projectId={project.id} workflows={workflows} sort={sort} onSort={onSort} />}
    />
  );
}

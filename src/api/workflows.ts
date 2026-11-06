/** Workflows on Lightning's API (api/workflows.md): the API's shape, its mapper, its keys, and the hooks a query calls. */
import { useQuery } from "@tanstack/react-query";
import type { SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import type { WorkflowListItem, WorkflowSortKey, WorkOrderDisplayState } from "@/types/workflows";
import { listAll, sortParam, statusOf } from "./client";

/** A workflow as `GET /api/projects/:id/workflows` lists it. `stats` comes with `include=stats`, which is planned. */
export interface ApiWorkflow {
  id: string;
  name: string;
  updated_at: string;
  stats?: { last_work_order: { state: WorkOrderDisplayState; updated_at: string } | null };
}

/** A row of a project's Workflows list. */
export function workflowListItem(w: ApiWorkflow): WorkflowListItem {
  const last = w.stats?.last_work_order ?? null;
  return { id: w.id, name: w.name, updatedAt: w.updated_at, lastWorkOrder: last && { state: last.state, updatedAt: last.updated_at } };
}

/** The `sort` fields the list takes, so a query can check what the URL asks for. */
const SORT_KEYS: Record<WorkflowSortKey, true> = { name: true, updated_at: true, last_work_order_updated_at: true };
export const isWorkflowSortKey = (key: string | undefined): key is WorkflowSortKey => key !== undefined && Object.hasOwn(SORT_KEYS, key);

export const workflowKeys = { inProject: (projectId: string) => ["projects", projectId, "workflows"] as const };

/**
 * A project's workflows with their latest work order, in the order the
 * server sorts them (the planned `sort`, `-` for descending), and where
 * loading them stands.
 */
export function useWorkflows(
  projectId: string,
  sort: SortState<WorkflowSortKey>
): { status: ResourceStatus; workflows: WorkflowListItem[] } {
  const param = sortParam(sort);
  const query = useQuery({
    queryKey: [...workflowKeys.inProject(projectId), "stats", param],
    queryFn: () => listAll<ApiWorkflow>(`/api/projects/${projectId}/workflows?include=stats&sort=${param}`, "workflows"),
    select: (rows) => rows.map(workflowListItem),
    // Re-sorting keeps the old rows on screen until the new order arrives; another project's never show.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === projectId ? previous : undefined),
  });
  return { status: statusOf(query), workflows: query.data ?? [] };
}

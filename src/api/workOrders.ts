/** Work orders on Lightning's API (api/work-orders.md): the API's shape, its mapper, its keys, and the hook History calls. */
import { useQuery } from "@tanstack/react-query";
import type { HistoryWorkOrderState, RunState, StepExitReason, WorkOrderFilters, WorkOrderRow } from "@/types/history";
import type { SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { request, sortParam, statusOf } from "./client";

/** How often History asks again while a row on screen is pending or running. */
export const WORK_ORDER_REFRESH_MS = 5000;
export const WORK_ORDER_PAGE_SIZE = 10;

/** A step as `GET /api/runs/:id/steps` sends it (api/runs.md). `job_name` is planned. */
interface ApiStep {
  id: string;
  attributes: {
    job_id: string;
    job_name?: string;
    exit_reason: StepExitReason | null;
    error_type: string | null;
    started_at: string | null;
    finished_at: string | null;
    input_dataclip_id: string | null;
    output_dataclip_id: string | null;
  };
}
/** A run as `GET /api/runs/:id` sends it (api/runs.md). `inserted_at` is planned; `steps` is a gap (docs/api-gaps.md, History). */
interface ApiRun {
  id: string;
  attributes: {
    state: RunState;
    started_at: string | null;
    finished_at: string | null;
    error_type: string | null;
    inserted_at?: string;
  };
  steps?: ApiStep[];
}
/** A work order as `GET /api/projects/:id/work_orders?include=runs` lists it. `workflow_id`, `dataclip_*` and `runs` are planned. */
interface ApiWorkOrder {
  id: string;
  attributes: {
    state: HistoryWorkOrderState;
    last_activity: string;
    inserted_at: string;
    updated_at: string;
    workflow_id: string;
    dataclip_id: string;
    dataclip_wiped: boolean;
  };
  runs?: ApiRun[];
}
interface ApiWorkOrderPage {
  data: ApiWorkOrder[];
  meta: { total_entries: number };
}

/**
 * A History row. The API sends no workflow name, so it comes from the
 * project's workflows. What it doesn't say about a step (cloned from an
 * earlier run, input wiped, job deleted) reads as "no" (docs/api-gaps.md, History).
 */
function workOrderRow(wo: ApiWorkOrder, projectId: string, workflowName: (id: string) => string): WorkOrderRow {
  const a = wo.attributes;
  const runs = wo.runs ?? [];
  const base = `/projects/${projectId}`;
  return {
    id: wo.id,
    workflowId: a.workflow_id,
    workflowName: workflowName(a.workflow_id),
    state: a.state,
    dataclipId: a.dataclip_id,
    dataclipWiped: a.dataclip_wiped,
    insertedAt: a.inserted_at,
    lastActivity: a.last_activity,
    runs: runs.map(({ id, attributes: r, steps = [] }) => {
      const insertedAt = r.inserted_at ?? r.started_at ?? a.inserted_at;
      return {
        id,
        state: r.state,
        insertedAt,
        claimedAt: null,
        startedAt: r.started_at,
        finishedAt: r.finished_at,
        updatedAt: r.finished_at ?? insertedAt,
        href: `${base}/runs/${id}`,
        steps: steps.map(({ id: stepId, attributes: s }) => ({
          id: stepId,
          jobId: s.job_id,
          jobName: s.job_name ?? "",
          exitReason: s.exit_reason,
          errorType: s.error_type,
          startedAt: s.started_at,
          finishedAt: s.finished_at,
          cloned: false,
          inputWiped: false,
          jobDeleted: false,
          href: `${base}/runs/${id}?step=${stepId}`,
          inspectHref: `${base}/w/${a.workflow_id}?run=${id}&panel=editor&job=${s.job_id}#log`,
        })),
      };
    }),
    href: `${base}/history?filters[workorder_id]=${wo.id}`,
    workflowHref: runs[0] ? `${base}/w/${a.workflow_id}?run=${runs[0].id}` : null,
    dataclipHref: `${base}/dataclips/${a.dataclip_id}/show`,
  };
}

/** The list's query string: History's filters as the API names them. */
export function workOrderQuery(filters: WorkOrderFilters, sort: SortState, page: number) {
  const q = new URLSearchParams({ include: "runs", page: String(page), page_size: String(WORK_ORDER_PAGE_SIZE) });
  const set = (key: string, value: string | null) => value && q.set(key, value);
  set("workflow_id", filters.workflowId);
  set("id", filters.workorderId);
  set("state", filters.statuses.join(","));
  set("inserted_after", filters.receivedAfter);
  set("inserted_before", filters.receivedBefore);
  set("last_activity_after", filters.activityAfter);
  set("last_activity_before", filters.activityBefore);
  if (filters.searchTerm) {
    q.set("search", filters.searchTerm);
    q.set("search_fields", filters.searchFields.join(","));
  }
  q.set("sort", sortParam(sort));
  return q.toString();
}

export const workOrderKeys = { inProject: (projectId: string) => ["projects", projectId, "work_orders"] as const };

const live = (data: ApiWorkOrderPage | undefined) =>
  !!data?.data.some((wo) => wo.attributes.state === "pending" || wo.attributes.state === "running");

/**
 * One page of a project's work orders as History rows, filtered and sorted by
 * the server. Asks again every few seconds while a row is pending or running.
 */
export function useWorkOrders(
  projectId: string,
  filters: WorkOrderFilters,
  sort: SortState,
  page: number,
  workflowName: (id: string) => string
): { status: ResourceStatus; rows: WorkOrderRow[]; totalEntries: number } {
  const params = workOrderQuery(filters, sort, page);
  const query = useQuery({
    queryKey: [...workOrderKeys.inProject(projectId), params],
    queryFn: () => request<ApiWorkOrderPage>("GET", `/api/projects/${projectId}/work_orders?${params}`),
    // A new page or filter keeps the old rows on screen until it arrives; another project's never show.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[1] === projectId ? previous : undefined),
    refetchInterval: (q) => (live(q.state.data) ? WORK_ORDER_REFRESH_MS : false),
  });
  return {
    status: statusOf(query),
    rows: (query.data?.data ?? []).map((wo) => workOrderRow(wo, projectId, workflowName)),
    totalEntries: query.data?.meta.total_entries ?? 0,
  };
}

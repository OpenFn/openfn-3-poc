import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useCurrentProject, useProjectPermissions, useProjectTree } from "@/api/projects";
import { useWorkOrders, WORK_ORDER_PAGE_SIZE } from "@/api/workOrders";
import { useWorkflows } from "@/api/workflows";
import { projectLabel } from "@/components/shell/projectPickerItems";
import { useCurrentUser } from "@/session/session";
import type { SortState } from "@/types/lists";
import { filtersFrom } from "@/utils/history";
import HistoryWorkOrdersPage from "./HistoryWorkOrdersPage";

/** Invocation's `@workorders_count_limit`: the server counts a search no further. */
const SEARCH_LIMIT = 50;
const notOnApi = () => Promise.reject(new Error("Not on the API yet"));
// Both lists, so rows never show "Untitled" while the workflow names load.
const stateOf = (states: string[]) =>
  states.every((s) => s === "ready") ? "ready" : states.includes("loading") ? "loading" : "error";

/**
 * HistoryWorkOrdersPage's query, under ProjectGate: the URL's filters in
 * Lightning's format, one page of work orders from the API, and the project's
 * workflows for the workflow filter. Actions aren't on the API yet.
 */
export default function HistoryWorkOrdersPageQuery() {
  const { projectId = "" } = useParams();
  const [params] = useSearchParams();
  const project = useCurrentProject(projectId);
  const can = useProjectPermissions(project.id);
  const { projects } = useProjectTree();
  const user = useCurrentUser();
  // Fixed while the page is open, so the default "past 30 days" doesn't make a new request every render.
  const [now] = useState(Date.now);
  const filters = filtersFrom(params, now);
  const sort: SortState = {
    key: params.get("filters[sort_by]") === "inserted_at" ? "inserted_at" : "last_activity",
    direction: params.get("filters[sort_direction]") === "asc" ? "asc" : "desc",
  };
  const pageNumber = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const { status: workflowsStatus, workflows } = useWorkflows(project.id, { key: "name", direction: "asc" });
  const nameOf = (id: string) => workflows.find((w) => w.id === id)?.name ?? "Untitled";
  const { status, rows, totalEntries } = useWorkOrders(project.id, filters, sort, pageNumber, nameOf);

  return (
    <HistoryWorkOrdersPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      channelsEnabled={user.experimentalFeatures}
      workOrdersHref={`/projects/${project.id}/history`}
      channelLogsHref={`/projects/${project.id}/history/channels`}
      // The API sends no jobs per workflow; "Retry from" isn't on the API yet either.
      workflows={workflows.map((w) => ({ id: w.id, name: w.name, jobs: [] }))}
      filters={filters}
      rows={rows}
      state={stateOf([status.state, workflowsStatus.state])}
      page={{ number: pageNumber, size: WORK_ORDER_PAGE_SIZE, totalEntries }}
      sort={sort}
      searchLimit={SEARCH_LIMIT}
      // Hides the row actions until they're on the API.
      canRunWorkflow={false}
      dataStorageHref={can("edit_data_retention") ? `/projects/${project.id}/settings#data-storage` : null}
      onCheckRunLimit={async () => {}}
      onCancelWorkOrder={notOnApi}
      onRetryWorkOrder={notOnApi}
      onCancelRun={notOnApi}
      onRetryStep={notOnApi}
      onBulkCancel={notOnApi}
      onBulkRetry={notOnApi}
      onExport={notOnApi}
    />
  );
}

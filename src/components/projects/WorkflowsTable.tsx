import type { ReactNode } from "react";
import { useRouter } from "../../routing/router";
import type { WorkflowRow, WorkflowsSort } from "../../types/workflows";
import { cn } from "../../utils/cn";
import { EmptyState, Table, Td, Th, Tr } from "../Table";
import Toggle from "../Toggle";
import Tooltip from "../Tooltip";
import DateTime from "../DateTime";
import Button from "../Button";
import Pill from "../Pill";
import TextLink from "../TextLink";
import WorkOrderStatus from "./WorkOrderStatus";
import { useTableSort, type SortValue } from "../useTableSort";

type SortKey = "name" | "last_workorder_updated_at" | "workorders_count" | "failed_workorders_count" | "enabled";

const sortMap: Record<SortKey, (s: WorkflowRow) => SortValue> = {
  name: (s) => s.workflow.name,
  last_workorder_updated_at: (s) => s.lastWorkOrder?.updatedAt ?? null,
  workorders_count: (s) => s.workordersCount,
  failed_workorders_count: (s) => s.failedWorkordersCount,
  enabled: (s) => s.workflow.enabled,
};

/**
 * The workflows index table (DashboardComponents.workflows_table): name and
 * last update, latest work order, work order counts (linking to History),
 * failures, the Enabled toggle, and Health / Delete. Every column but Actions
 * sorts, in the browser unless the host passes `sort` and keeps the order in
 * the URL. A row opens the workflow editor. With the lifecycle on (an
 * experimental feature) an ordinary project shows the state instead of the
 * switch, and a sandbox's column reads "Turn on".
 */
export default function WorkflowsTable({
  stats,
  projectId,
  searchTerm = "",
  canDelete = true,
  period = "last 30 days",
  lifecycle = false,
  isSandbox = false,
  sort,
  onToggle,
  onDelete,
}: {
  stats: WorkflowRow[];
  projectId: string;
  searchTerm?: string;
  canDelete?: boolean;
  period?: string;
  lifecycle?: boolean;
  isSandbox?: boolean;
  sort?: WorkflowsSort | undefined;
  onToggle?: (workflowId: string, enabled: boolean) => void;
  onDelete?: (workflowId: string) => void;
}) {
  const { navigate } = useRouter();
  const local = useTableSort({ rows: stats, sortMap, initialKey: "name" });
  const rows = sort ? stats : local.rows;
  const thProps = (key: SortKey) =>
    sort
      ? { sortDirection: sort.key === key ? sort.direction : null, onSort: () => sort.onSort(key), sortHref: sort.hrefFor(key) }
      : local.thProps(key);
  const history = `/projects/${projectId}/history`;
  const stateColumn = lifecycle ? (isSandbox ? "Turn on" : "State") : "Enabled";

  if (stats.length === 0) {
    return (
      <EmptyState
        variant="plain"
        message={searchTerm !== "" ? (
          <>
            No workflows found matching "{searchTerm}". Try a different search term or{" "}
            <TextLink to={`/projects/${projectId}/w/new`}>create a new one</TextLink>.
          </>
        ) : (
          <>
            No workflows found. <TextLink to={`/projects/${projectId}/w/new`}>Create one</TextLink> to start
            automating.
          </>
        )}
      />
    );
  }

  return (
    <Table
      id="workflows-table"
      header={
        <Tr>
          <Th {...thProps("name")}>Name</Th>
          <Th {...thProps("last_workorder_updated_at")}>Latest Work Order</Th>
          <Th {...thProps("workorders_count")}>Work Orders</Th>
          <Th {...thProps("failed_workorders_count")}>Work Orders in a failed state</Th>
          <Th {...thProps("enabled")}>{stateColumn}</Th>
          <Th actions align="right">Actions</Th>
        </Tr>
      }
    >
      {rows.map((s) => {
        const wf = s.workflow;
        const on = s.triggerEnabled ?? wf.enabled;
        return (
          <Tr key={wf.id} id={`workflow-${wf.id}`} onClick={() => navigate(`/projects/${projectId}/w/${wf.id}`)}>
            <Td className="max-w-60">
              <Tooltip content={on ? wf.name : `${wf.name} (disabled)`}>
                <p className={cn("workflow-name truncate font-medium", on ? "text-gray-900" : "text-gray-400")}>
                  {wf.name}
                </p>
              </Tooltip>
              <p className="mt-1 text-xs">
                Updated <DateTime value={wf.updatedAt} />
              </p>
            </Td>
            <Td>
              <WorkOrderStatus state={s.lastWorkOrder?.state ?? null} updatedAt={s.lastWorkOrder?.updatedAt} period={period} />
            </Td>
            <Td>
              <Count value={s.workordersCount} to={s.historyHref ?? history}>
                ({s.stepCount} steps, {s.stepSuccessRate.toFixed(1)}% success)
              </Count>
            </Td>
            <Td>
              <Count value={s.failedWorkordersCount} to={s.failedHistoryHref ?? history}>
                Latest failure {s.lastFailedAt && <DateTime value={s.lastFailedAt} />}
              </Count>
            </Td>
            <Td>
              {lifecycle && !isSandbox ? (
                <Pill color={s.state === "live" ? "green" : "gray"}>{s.state === "live" ? "Live" : "Draft"}</Pill>
              ) : (
                <Toggle
                  id={wf.id}
                  name="workflow_state"
                  checked={wf.enabled}
                  onChange={(v) => onToggle?.(wf.id, v)}
                  tooltip={s.toggleTooltip ?? toggleTooltip(wf.triggerType, wf.enabled, lifecycle, s.state)}
                />
              )}
            </Td>
            <Td actions>
              <Button theme="secondary" size="xs" to={`/projects/${projectId}/w/${wf.id}/health`}>
                Health
              </Button>
              {canDelete && (
                <Button
                  theme="secondary"
                  size="xs"
                  onClick={() => {
                    if (window.confirm("Are you sure you'd like to delete this workflow?")) onDelete?.(wf.id);
                  }}
                >
                  Delete
                </Button>
              )}
            </Td>
          </Tr>
        );
      })}
    </Table>
  );
}

/** Lightning's `Helpers.workflow_state_tooltip`, or the lifecycle wording. */
function toggleTooltip(triggerType: string, enabled: boolean, lifecycle: boolean, state: "live" | "draft" | undefined) {
  if (lifecycle) return state === "live" ? "On. Its triggers are answering." : "Off. Its triggers are not answering.";
  return enabled ? `This workflow is active (${triggerType} trigger enabled)` : "This workflow is inactive (manual runs only)";
}

/**
 * A work order count linking to History with a detail line under it, or a
 * gray 0 and "N/A". The space between the two lines keeps them apart in the
 * cell's text, as a template's line break would.
 */
function Count({ value, to, children }: { value: number; to: string; children: ReactNode }) {
  return (
    <>
      <div className="text-lg">{value > 0 ? <TextLink to={to}>{value}</TextLink> : <span className="text-gray-400">0</span>}</div>{" "}
      <div className="mt-1 text-xs">{value > 0 ? children : "N/A"}</div>
    </>
  );
}

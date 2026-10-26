/**
 * Extra fixtures and lookups for History, the run page and the dataclip page,
 * layered on top of the shared `history.ts` (which stays read-only here).
 * Static data only.
 */
import { dataclips, findDataclip, runLogs, runs, steps, stepsOf, workOrders } from "./history";
import type { HistoryWorkOrderState, LogLine, RunRow, WorkOrderRow, WorkOrderState } from "../types/history";
import type { Run, Step, WorkOrder } from "./models/history";

/**
 * The Work Orders / Channel Logs pill tabs only show when the current user
 * has experimental features on (`channels_enabled` in run_live/index.ex).
 * The demo user doesn't, matching the reference screenshot.
 */
export const historyChannelsEnabled = false;

/** Runs of a work order, newest first (Lightning preloads them in that order). */
export function runsOfWorkOrder(wo: WorkOrder): Run[] {
  return wo.runIds
    .map((id) => runs.find((r) => r.id === id))
    .filter((r): r is Run => Boolean(r))
    .sort((a, b) => b.insertedAt.localeCompare(a.insertedAt));
}

/** A run as History's expanded work order shows it, with the links Lightning builds. */
export function runRow(run: Run, workflowId: string, projectId: string): RunRow {
  return {
    id: run.id,
    state: run.state,
    insertedAt: run.insertedAt,
    claimedAt: run.startedAt ?? run.insertedAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    updatedAt: run.finishedAt ?? run.insertedAt,
    href: `/projects/${projectId}/runs/${run.id}`,
    steps: stepsOf(run).map((s) => ({
      id: s.id,
      jobId: s.jobId,
      jobName: s.jobName,
      exitReason: s.exitReason,
      errorType: s.errorType ?? null,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
      cloned: (s.insertedAt ?? s.startedAt) < run.insertedAt,
      inputWiped: !!findDataclip(s.inputDataclipId)?.wiped,
      jobDeleted: false,
      href: `/projects/${projectId}/runs/${run.id}?step=${s.id}`,
      inspectHref: `/projects/${projectId}/w/${workflowId}?run=${run.id}&panel=editor&job=${s.jobId}#log`,
    })),
  };
}

/** The replica's finer work order states, as Lightning names them. */
function rowState(state: WorkOrderState): HistoryWorkOrderState {
  if (state === "available") return "pending";
  if (state === "claimed" || state === "started") return "running";
  return state;
}

/** A work order as History lists it: runs newest first, with their steps. */
export function workOrderRow(wo: WorkOrder): WorkOrderRow {
  const runs = runsOfWorkOrder(wo);
  return {
    id: wo.id,
    workflowId: wo.workflowId,
    workflowName: wo.workflowName,
    state: rowState(wo.state),
    dataclipId: wo.dataclipId,
    dataclipWiped: !!findDataclip(wo.dataclipId)?.wiped,
    insertedAt: wo.insertedAt,
    lastActivity: wo.lastActivity,
    runs: runs.map((r) => runRow(r, wo.workflowId, wo.projectId)),
    href: `/projects/${wo.projectId}/history?filters[workorder_id]=${wo.id}`,
    workflowHref: runs[0] ? `/projects/${wo.projectId}/w/${wo.workflowId}?run=${runs[0].id}` : null,
    dataclipHref: `/projects/${wo.projectId}/dataclips/${wo.dataclipId}/show`,
  };
}

export function findStep(id: string | undefined): Step | undefined {
  return steps.find((s) => s.id === id);
}

/** A run's final dataclip: its last step's output. */
export function finalDataclipIdOf(run: Run): string | null {
  const s = stepsOf(run);
  return s.length ? s[s.length - 1]!.outputDataclipId : null;
}

export function logsOf(run: Run): LogLine[] {
  return runLogs[run.id] ?? [];
}

/**
 * The jobs of each workflow, for the "Retry from" modal. Derived from the
 * steps in the fixtures.
 */
export function workflowJobs(workflowId: string): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const wo of workOrders.filter((w) => w.workflowId === workflowId)) {
    for (const run of runsOfWorkOrder(wo)) {
      for (const step of stepsOf(run)) seen.set(step.jobId, step.jobName);
    }
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** When each dataclip was last updated (Lightning shows Created + Updated). */
export function dataclipUpdatedAt(id: string): string | undefined {
  return dataclips.find((d) => d.id === id)?.insertedAt;
}

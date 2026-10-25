/** Work orders, runs, steps, dataclips and logs. Types only: no data, no behaviour. */

export type RunState =
  | "available"
  | "claimed"
  | "started"
  | "success"
  | "failed"
  | "crashed"
  | "cancelled"
  | "killed"
  | "exception"
  | "lost";

/** A work order's state is its latest run's state, plus "pending"/"rejected". */
export type WorkOrderState = RunState | "pending" | "rejected";

/** How a step ended; null while it runs. */
export type StepExitReason = "success" | "fail" | "crash" | "cancel" | "kill" | "exception" | "lost";

export type DataclipType = "http_request" | "global" | "step_result" | "saved_input" | "kafka";

export interface Dataclip {
  id: string;
  projectId: string;
  type: DataclipType;
  name: string | null;
  body: unknown;
  insertedAt: string;
  /** Body wiped by the project's retention policy. */
  wiped: boolean;
}

export interface Step {
  id: string;
  runId: string;
  jobId: string;
  jobName: string;
  exitReason: StepExitReason | null;
  /** Why a killed step was killed (SecurityError, TimeoutError, OOMError…); picks the icon. */
  errorType?: string | null;
  startedAt: string;
  finishedAt: string | null;
  /** When the step row was written. A step older than its run was cloned from an earlier run. */
  insertedAt?: string;
  inputDataclipId: string;
  outputDataclipId: string | null;
}

export interface Run {
  id: string;
  workOrderId: string;
  state: RunState;
  startingTrigger: string | null;
  startingJob: string | null;
  createdBy: string | null;
  insertedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  stepIds: string[];
}

export interface WorkOrder {
  id: string;
  projectId: string;
  workflowId: string;
  workflowName: string;
  state: WorkOrderState;
  dataclipId: string;
  insertedAt: string;
  lastActivity: string;
  runIds: string[];
}

export interface LogLine {
  timestamp: string;
  /** "R/T", "JOB", "ADA", "CLI"; the worker may add others. */
  source: string;
  /** "debug", "info", "warn", "error"; anything else ("success", "always") always shows. */
  level: string;
  message: string;
  stepId?: string | null;
}

/** The run page's run (RunLive.Show): the detail rows and the version chip. */
export interface RunDetail {
  id: string;
  workOrderId: string;
  state: RunState;
  /** The creator's email, or "Webhook trigger" / "Cron trigger"; null when neither is known. */
  startedBy: string | null;
  insertedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  finalDataclipId: string | null;
  snapshot: { id: string; lockVersion: number; insertedAt: string };
}

/** The run page's workflow: the link and the version the chip compares against. */
export interface RunWorkflow {
  id: string;
  name: string;
  lockVersion: number;
}

/** A step on the run page: its own snapshot version pins the inspect link. */
export interface RunStep extends Omit<Step, "runId"> {
  insertedAt: string;
  snapshotLockVersion: number;
}

/** The dataclip page's record (DataclipLive.Show): metadata only, the body arrives separately. */
export interface DataclipDetail {
  id: string;
  type: DataclipType;
  insertedAt: string;
  updatedAt: string;
  wipedAt: string | null;
}

/** A selected step's input or output: the body arrives separately and may still be loading. */
export interface StepDataclip {
  id: string;
  wiped: boolean;
  body?: unknown;
}

export type SearchFieldId = "id" | "dataclip_name" | "body" | "log";

/**
 * A work order's state as Lightning has it (WorkOrder `states`): pending and
 * running while active, then rejected or its last run's final state. Also
 * History's status filter ids, each its own `filters[<id>]=true` in the URL.
 */
export type HistoryWorkOrderState =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "crashed"
  | "cancelled"
  | "killed"
  | "exception"
  | "lost"
  | "rejected";

/** A step in an expanded History work order (run_live/components.ex `step_list_item`). */
export interface StepRow {
  id: string;
  jobId: string;
  jobName: string;
  exitReason: StepExitReason | null;
  /** Why a killed step was killed; picks the icon and follows the exit reason ("kill:TimeoutError"). */
  errorType: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Ran in an earlier run and reused by this one: shown faded, with a paper clip. */
  cloned: boolean;
  /** Its input was wiped by the retention policy, so it can't be rerun. */
  inputWiped: boolean;
  /** Its job is no longer in the workflow, so it can't be rerun. */
  jobDeleted: boolean;
  /** The run page, open on this step. */
  href: string;
  /** The workflow editor on this run and job, pinned to the version it ran. */
  inspectHref: string;
}

/** A run in an expanded History work order (workorder_component.ex). */
export interface RunRow {
  id: string;
  state: RunState;
  insertedAt: string;
  claimedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** When a cancelled run was cancelled. */
  updatedAt: string;
  /** The run page. */
  href: string;
  steps: StepRow[];
}

/** A row of History's work orders table (workorder_component.ex). */
export interface WorkOrderRow {
  id: string;
  workflowId: string;
  /** The name the work order ran under (its snapshot's), or "Untitled". */
  workflowName: string;
  state: HistoryWorkOrderState;
  dataclipId: string;
  /** Its input was wiped by the retention policy: it can't be selected or retried. */
  dataclipWiped: boolean;
  insertedAt: string;
  lastActivity: string;
  /** Newest first. */
  runs: RunRow[];
  /** History filtered to this work order. */
  href: string;
  /** The workflow editor on the latest run; null when there are no runs. */
  workflowHref: string | null;
  /** The input dataclip's page. */
  dataclipHref: string;
}

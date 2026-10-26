/** Work orders, runs, steps and dataclips, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { DataclipType, RunState, StepExitReason, WorkOrderState } from "../../types/history";

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

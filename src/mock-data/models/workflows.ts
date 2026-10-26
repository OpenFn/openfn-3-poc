/** Workflow summaries and the dashboard figures built on them, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { TriggerType, WorkflowRow } from "../../types/workflows";

export interface WorkflowSummary {
  id: string;
  projectId: string;
  name: string;
  triggerType: TriggerType;
  /** Whether the trigger is enabled ("Active" toggle on the index). */
  enabled: boolean;
  /** Human-readable trigger description, e.g. the cron expression. */
  triggerLabel: string;
  lastRunAt: string | null;
  lastRunStatus: "success" | "failed" | "crashed" | "running" | null;
  workOrderCount: number;
  failedWorkOrderCount: number;
  updatedAt: string;
  insertedAt: string;
}

/** A workflow's dashboard figures (`DashboardStats.WorkflowStats`): a workflows table row, plus what the metric cards count. */
export interface WorkflowStats extends Omit<WorkflowRow, "workflow"> {
  workflow: WorkflowSummary;
  /** Counted for the metric cards. */
  pendingWorkorders: number;
  runs: { total: number; pending: number; success: number };
}

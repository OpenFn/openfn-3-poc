/** The projects dashboard and workflows index: their rows and metric cards. Types only: no data, no behaviour. */
import type { ProjectRole } from "./projects";

export type TriggerType = "webhook" | "cron" | "kafka";

/** A row on the projects dashboard (`ProjectOverviewRow`). */
export interface ProjectOverview {
  id: string;
  name: string;
  /** The user's role, or "support" for a project reached through support access. */
  role: ProjectRole | "support";
  workflowsCount: number;
  collaboratorsCount: number;
  /** Latest workflow update in the project; null when it has none. */
  lastUpdatedAt: string | null;
}

export type WorkOrderDisplayState =
  | "rejected"
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "crashed"
  | "cancelled"
  | "killed"
  | "exception"
  | "lost";

/** One row of the workflows index table (`DashboardStats.WorkflowStats`): the fields it shows, and nothing else. */
export interface WorkflowRow {
  workflow: {
    id: string;
    name: string;
    updatedAt: string;
    /** Whether the trigger is enabled ("Active" toggle on the index). */
    enabled: boolean;
    triggerType: TriggerType;
  };
  lastWorkOrder: { state: WorkOrderDisplayState; updatedAt: string } | null;
  lastFailedAt: string | null;
  workordersCount: number;
  failedWorkordersCount: number;
  stepCount: number;
  stepSuccessRate: number;
  /** History filtered to this workflow's work orders in the window; the host builds it. */
  historyHref?: string | undefined;
  /** History filtered to this workflow's failed work orders in the window. */
  failedHistoryHref?: string | undefined;
  /** The workflow's lifecycle state, shown instead of the switch when the lifecycle is on. */
  state?: "live" | "draft" | undefined;
  /** Hover text for the switch; defaults to Lightning's wording from the trigger. */
  toggleTooltip?: string | undefined;
  /** Whether any trigger is on (the name greys out when none is); defaults to the switch's state. */
  triggerEnabled?: boolean | undefined;
}

/** The four metric cards above the workflows table (`ProjectMetrics`). */
export interface ProjectMetrics {
  workOrders: { total: number; pending: number; failed: number; failedPercentage: number };
  runs: { total: number; pending: number; success: number; successRate: number };
}

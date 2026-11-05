/** The projects dashboard and the workflows list: their rows. Types only: no data, no behaviour. */
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

/** A workflow on a project's Workflows list: what its row shows. */
export interface WorkflowListItem {
  id: string;
  name: string;
  updatedAt: string;
  /** The latest work order in the last 30 days, or null. */
  lastWorkOrder: { state: WorkOrderDisplayState; updatedAt: string } | null;
}


/** The fields a project's workflows list sorts by, as the API names them (api/workflows.md, planned `sort`). */
export type WorkflowSortKey = "name" | "updated_at" | "last_work_order_updated_at";

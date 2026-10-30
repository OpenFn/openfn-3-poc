import type { RunDisplayState, StepExitReason } from "../types/history";
import type { WorkOrderDisplayState } from "../types/workflows";

/**
 * Every run-state colour, in one place. The shades are Lightning's and differ
 * on purpose between the dot, the text and the icon (a crash is orange-800 as
 * an icon and orange-500 as text): parity first, unify at the redesign. A
 * status grey is a status, not a neutral, so the greys here stay raw palette.
 */

/** A work-order or run state pill (run_live/components.ex `state_pill`
 * chip_styles), on Pill's tag shades. Goes in Pill's `className`. */
export const STATE_PILL: Record<RunDisplayState, string> = {
  rejected: "bg-danger-100 text-danger-700",
  pending: "bg-gray-100 text-gray-700",
  running: "bg-info-100 text-info-700",
  available: "bg-gray-100 text-gray-700",
  claimed: "bg-info-100 text-info-700",
  started: "bg-info-100 text-info-700",
  success: "bg-success-100 text-success-700",
  failed: "bg-danger-100 text-danger-700",
  crashed: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-700",
  killed: "bg-warning-100 text-warning-800",
  exception: "bg-gray-100 text-gray-700",
  lost: "bg-gray-100 text-gray-700",
};

/** The work-order dot (DashboardComponents.state_card). */
export const WORK_ORDER_DOT: Record<WorkOrderDisplayState, string> = {
  rejected: "bg-gray-300",
  pending: "bg-gray-600",
  running: "bg-info-600",
  success: "bg-success-600",
  failed: "bg-danger-600",
  crashed: "bg-orange-600",
  cancelled: "bg-gray-500",
  killed: "bg-warning-600",
  exception: "bg-gray-300 border-2 border-gray-800",
  lost: "bg-gray-300 border-2 border-gray-800",
};

/** The work-order state's text, next to the dot. */
export const WORK_ORDER_TEXT: Record<WorkOrderDisplayState, string> = {
  rejected: "text-gray-600",
  pending: "text-gray-600",
  running: "text-info-700",
  success: "text-success-800",
  failed: "text-danger-700",
  crashed: "text-orange-700",
  cancelled: "text-gray-600",
  killed: "text-warning-800",
  exception: "text-gray-600",
  lost: "text-gray-600",
};

/** A step's exit-reason icon (run_live/components.ex `step_icon`). */
export const STEP_ICON: Record<StepExitReason | "pending", string> = {
  pending: "text-gray-400",
  success: "text-success-500",
  fail: "text-danger-500",
  crash: "text-orange-800",
  cancel: "text-gray-600",
  kill: "text-warning-800",
  exception: "text-black",
  lost: "text-black",
};

/** The run icon on a canvas node. */
export const NODE_RUN_ICON: Record<string, string> = {
  running: "text-info-500",
  success: "text-success-500",
  fail: "text-danger-500",
  crash: "text-orange-800",
};

/** A canvas node's stroke and fill (workflow-diagram/styles.ts). Used in
 * `style`, since SVG presentation attributes don't read `var()`. */
export const NODE_RUN_BORDER: Record<string, string> = {
  success: "var(--color-success-600)",
  fail: "var(--color-danger-600)",
  crash: "var(--color-orange-600)",
  running: "var(--color-info-500)",
};
export const NODE_RUN_FILL: Record<string, string> = {
  success: "var(--color-success-100)",
  fail: "var(--color-danger-100)",
  crash: "var(--color-orange-100)",
  running: "var(--color-info-100)",
};

import type { StepExitReason } from "../../types/history";
import { cn } from "../../utils/cn";
import { STEP_ICON } from "../../theme/runStateColours";

const icons: Record<StepExitReason | "pending", string> = {
  pending: "hero-ellipsis-horizontal-circle-solid",
  success: "hero-check-circle-solid",
  fail: "hero-x-circle-solid",
  crash: "hero-x-circle-solid",
  cancel: "hero-no-symbol-solid",
  kill: "hero-exclamation-circle-solid",
  exception: "hero-exclamation-triangle-solid",
  lost: "hero-exclamation-triangle-solid",
};

/** A killed step's icon by what killed it (run_live/components.ex `step_icon`). */
const killIcons: Record<string, string> = {
  SecurityError: "hero-shield-exclamation-solid",
  ImportError: "hero-shield-exclamation-solid",
  TimeoutError: "hero-clock-solid",
};

/** A step's exit-reason icon (run_live/components.ex `step_icon`). */
export default function StepIcon({ reason, errorType }: { reason: StepExitReason | null; errorType?: string | null }) {
  const key = reason && reason in icons ? reason : "pending";
  const base = icons[key];
  const icon = (reason === "kill" && errorType && killIcons[errorType]) || base;
  return <span className={cn(icon, "mr-1.5 h-5 w-5 flex-shrink-0 inline-block", STEP_ICON[key])} />;
}

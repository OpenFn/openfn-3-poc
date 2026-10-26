import Pill from "../Pill";
import { shortUuid, uuidOf } from "../../utils/format";

/**
 * "Run abc1234" chip with a dismiss X (collaborative-editor/components/common/
 * RunBadge.tsx), shown when a run is selected.
 */
export default function RunBadge({
  runId,
  onClose,
  closeLabel = "Remove",
  variant = "default",
  className,
}: {
  runId: string;
  onClose?: (() => void) | undefined;
  /** Accessible name for the x button. */
  closeLabel?: string;
  variant?: "default" | "warning";
  className?: string;
}) {
  return (
    <Pill color={variant === "default" ? "blue" : "yellow"} onRemove={onClose} removeLabel={closeLabel} className={className}>
      Run {shortUuid(uuidOf(runId), 7)}
    </Pill>
  );
}

import Pill from "../primitives/Pill";
import { shortUuid, uuidOf } from "../../utils/format";

/**
 * "Run abc1234" chip with a dismiss X (collaborative-editor/components/common/
 * RunBadge.tsx), shown when a run is selected.
 */
export default function RunBadge({
  runId,
  onClose,
  className,
}: {
  runId: string;
  onClose?: (() => void) | undefined;
  className?: string;
}) {
  return (
    <Pill tone="info" onRemove={onClose} className={className}>
      Run {shortUuid(uuidOf(runId), 7)}
    </Pill>
  );
}

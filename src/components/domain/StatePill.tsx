import type { RunDisplayState } from "../../types/history";
import type { ChannelRequestState } from "../../types/channels";
import Pill from "../primitives/Pill";
import type { Tone } from "../primitives/tone";
import { STATE_PILL } from "../../theme/runStateColours";
import { capitalize } from "../../utils/format";
import { stateLabel } from "../../utils/history";

/**
 * A work order or run state pill (run_live/components.ex `state_pill`).
 * Run states have more colours than the tones, so theirs come from
 * src/theme/runStateColours.ts. `labelMode="raw"` shows the state itself,
 * capitalised, as the canvas's MiniHistory does ("Pending" rather than "Enqueued").
 */
export default function StatePill({ state, labelMode = "display" }: { state: RunDisplayState; labelMode?: "display" | "raw" }) {
  return <Pill className={STATE_PILL[state]}>{labelMode === "raw" ? capitalize(state) : stateLabel(state)}</Pill>;
}

const channelConfig: Record<ChannelRequestState, { text: string; tone: Tone }> = {
  pending: { text: "In Progress", tone: "info" },
  success: { text: "Success", tone: "success" },
  failed: { text: "Failed", tone: "danger" },
  timeout: { text: "Timeout", tone: "warning" },
  error: { text: "Error", tone: "danger" },
};

/** A channel request state pill (`channel_state_pill`). `title` is its hover text. */
export function ChannelStatePill({ state, title }: { state: ChannelRequestState; title?: string | undefined }) {
  const { text, tone } = channelConfig[state];
  return (
    <Pill tone={tone} title={title}>
      {text}
    </Pill>
  );
}

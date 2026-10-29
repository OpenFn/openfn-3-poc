import Button from "../Button";
import { MenuItem } from "../Menu";
import SplitButton from "../SplitButton";

interface Props {
  onClick: () => void;
  /** When given, renders a split button whose menu offers "Run with custom input". */
  onRunWithCustomInputClick?: () => void;
  disabled?: boolean;
  isRunning?: boolean;
  text?: string | undefined;
  variant?: "primary" | "secondary";
  /** Hover text (Lightning shows the shortcut, or why it's disabled). */
  tooltip?: string;
}

/**
 * The Run button (collaborative-editor/components/NewRunButton.tsx): play
 * icon + label, optionally split with a chevron menu.
 */
export default function NewRunButton({
  onClick,
  onRunWithCustomInputClick,
  disabled = false,
  isRunning = false,
  text = "Run",
  variant = "primary",
  tooltip = "⌘ Enter",
}: Props) {
  const content = isRunning ? "Processing" : text;

  if (!onRunWithCustomInputClick) {
    return (
      <Button variant={variant} onClick={onClick} disabled={disabled} pending={isRunning} tooltip={tooltip} icon="hero-play-solid">
        {content}
      </Button>
    );
  }

  return (
    <SplitButton
      icon="hero-play-solid"
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      pending={isRunning}
      tooltip={tooltip}
      menuLabel="Open run options"
      menu={
        <MenuItem icon="hero-play" description="⌘ ⇧ Enter" onClick={onRunWithCustomInputClick}>
          Run with custom input
        </MenuItem>
      }
    >
      {content}
    </SplitButton>
  );
}

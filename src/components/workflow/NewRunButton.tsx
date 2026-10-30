import Button from "../primitives/Button";
import { MenuItem } from "../primitives/Menu";
import SplitButton from "../primitives/SplitButton";

interface Props {
  onClick: () => void;
  /** When given, renders a split button whose menu offers "Run with custom input". */
  onRunWithCustomInputClick?: () => void;
  disabled?: boolean;
  isRunning?: boolean;
  text?: string | undefined;
  variant?: "primary" | "secondary";
  /** Hover text while it can run (the shortcut). None while disabled or running, when the shortcut does nothing. */
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
  const hover = disabled || isRunning ? undefined : tooltip;

  if (!onRunWithCustomInputClick) {
    return (
      <Button variant={variant} onClick={onClick} disabled={disabled} pending={isRunning} tooltip={hover} icon="hero-play-solid">
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
      tooltip={hover}
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

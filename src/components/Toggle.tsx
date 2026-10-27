import { useId, type ReactNode } from "react";
import { cn } from "../utils/cn";
import Tooltip from "./Tooltip";

interface Props {
  checked: boolean;
  onChange?: ((checked: boolean) => void) | undefined;
  /** Shown to the right of the switch. */
  label?: string;
  /** Gray text after the label, e.g. "(currently optional for this project)". */
  note?: ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
  /** Hover text, e.g. why the switch is disabled. */
  tooltip?: string | undefined;
  /** id of an element that labels the switch, when there's no `label`. */
  labelledBy?: string;
  /** Name of the hidden checkbox that mirrors the state, as Lightning's toggle input has. */
  name?: string | undefined;
}

/**
 * Lightning's toggle switch (new_inputs.ex `type="toggle"`): primary-600
 * when on, with a check / cross in the knob. A hidden checkbox mirrors the
 * state, as Lightning's does, so forms and tests can read it.
 */
export default function Toggle({ checked, onChange, label, note, description, disabled = false, id, tooltip, labelledBy, name }: Props) {
  const labelId = useId();
  const button = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy ?? (label ? labelId : undefined)}
      // An unlabelled switch is named by its tooltip, as Lightning's toggle input is.
      aria-label={label || labelledBy ? undefined : tooltip}
      disabled={disabled}
      data-ui="toggle"
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        checked ? "bg-primary-600" : "bg-emphasis",
        "disabled:cursor-not-allowed disabled:opacity-50"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface shadow transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      >
        <span className={cn("h-4 w-4", checked ? "hero-check-micro text-primary-600" : "hero-x-mark-micro text-faint")} />
      </span>
    </button>
  );
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <Tooltip content={tooltip} disabled={disabled}>
          {button}
        </Tooltip>
        <input type="checkbox" name={name} checked={checked} readOnly tabIndex={-1} aria-hidden="true" className="hidden" />
        {label && (
          <span id={labelId} className="text-sm text-muted">
            <span className="font-medium text-strong">{label}</span>
            {note && <> {note}</>}
          </span>
        )}
      </div>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import Tooltip from "./Tooltip";
import type { Tone } from "./tone";

/** Tag colours, for tags that mean nothing (dataclip types, HTTP methods). Meaning goes in `tone`. */
export type PillColor = "gray" | "red" | "orange" | "yellow" | "green" | "blue" | "primary" | "purple" | "pink";
export type PillVariant = "subtle" | "solid";

const colorClasses: Record<PillColor, string> = {
  gray: "bg-gray-100 text-gray-700",
  red: "bg-red-100 text-red-700",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  primary: "bg-primary-100 text-primary-700",
  purple: "bg-purple-100 text-purple-700",
  pink: "bg-pink-100 text-pink-700",
};

const toneClasses: Record<PillVariant, Record<Tone, string>> = {
  subtle: {
    neutral: "bg-gray-100 text-gray-700",
    info: "bg-info-100 text-info-700",
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-800",
    danger: "bg-danger-100 text-danger-700",
  },
  solid: {
    neutral: "bg-gray-800 text-white",
    info: "bg-info-600 text-white",
    success: "bg-success-600 text-white",
    warning: "bg-warning-400 text-gray-900",
    danger: "bg-danger-600 text-white",
  },
};

/**
 * A small tag (Lightning's components/pills.ex `pill`): states, types,
 * versions, selected items. `tone` says what it means and `variant` how loud
 * it is; `color` is only for tags that mean nothing. `square` gives it
 * rounded-md corners, `mono` the code font, and `onRemove` an x button.
 */
export default function Pill({
  id,
  "aria-label": ariaLabel,
  tone,
  variant = "subtle",
  color,
  square = false,
  mono = false,
  title,
  onRemove,
  removeLabel = "Remove",
  className,
  children,
}: {
  id?: string;
  "aria-label"?: string;
  /** Leave it off for a plain grey tag. */
  tone?: Tone | undefined;
  variant?: PillVariant;
  /** A tag colour that means nothing. Takes the place of `tone` and `variant`. */
  color?: PillColor | undefined;
  square?: boolean;
  mono?: boolean;
  /** Hover text. */
  title?: string | undefined;
  /** Shows an x button that calls this. */
  onRemove?: (() => void) | undefined;
  /** Accessible name for the x button. */
  removeLabel?: string;
  className?: string | undefined;
  children: ReactNode;
}) {
  const pill = (
    <span
      id={id}
      aria-label={ariaLabel}
      data-ui="tag"
      data-tone={color ? undefined : tone}
      data-variant={color ? undefined : variant}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-xs font-medium",
        square ? "rounded-md" : "rounded-full",
        mono && "font-mono",
        color ? colorClasses[color] : toneClasses[variant][tone ?? "neutral"],
        onRemove && "pr-1",
        className
      )}
    >
      {children}
      {onRemove && (
        // Part of the chip, in its colour and smaller than any button size, so the pill draws it.
        <Tooltip content={removeLabel}>
          <button
            type="button"
            aria-label={removeLabel}
            onClick={onRemove}
            className="inline-flex rounded-full text-current opacity-60 hover:bg-black/10 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus"
          >
            <span className="hero-x-mark-mini h-4 w-4" aria-hidden="true" />
          </button>
        </Tooltip>
      )}
    </span>
  );
  return <Tooltip content={title}>{pill}</Tooltip>;
}

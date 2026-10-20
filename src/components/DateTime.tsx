import { useState, type SyntheticEvent } from "react";
import { formatRelative, formatRelativeDetailed, formatTimeOnly, formatUtc } from "../utils/format";
import { cn } from "../utils/cn";
import { useCopy } from "../utils/useCopy";
import Tooltip from "./Tooltip";

/**
 * Lightning's `Common.datetime`: a local, relative timestamp ("today at
 * 6:36 PM"). Hovering shows the UTC value; clicking copies it and the
 * tooltip says "Copied!" for 1.5 seconds. "--" when there's no value.
 */
export default function DateTime({
  value,
  format = "relative",
  className,
}: {
  value: string | null | undefined;
  format?: "relative" | "relative_detailed" | "time_only";
  className?: string;
}) {
  const utc = value ? formatUtc(value) : "";
  const { copied, copy } = useCopy(utc, 1500);
  const [open, setOpen] = useState(false);
  if (!value) return <span className={cn("text-gray-400", className)}>--</span>;
  const text =
    format === "time_only"
      ? formatTimeOnly(value)
      : format === "relative_detailed"
        ? formatRelativeDetailed(value)
        : formatRelative(value);
  // Like Lightning's Copy hook, copying goes no further, even inside a link or a clickable row.
  const onCopy = (e: SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    copy();
    setOpen(false); // "Copied!" holds it open, then it hides, as in Lightning.
  };
  return (
    <>
      <Tooltip
        side="top"
        open={open || copied}
        onOpenChange={setOpen}
        content={
          copied ? (
            "Copied!"
          ) : (
            <>
              {utc}
              <span className="block text-xs text-gray-400">Click to copy timestamp</span>
            </>
          )
        }
      >
        {/* A span, not a button, because Lightning puts dates inside links. */}
        <span
          role="button"
          tabIndex={0}
          // Stops Radix closing the tooltip on press, so it doesn't blink before "Copied!" (Lightning's hide-on-click is off).
          onPointerDown={(e) => e.preventDefault()}
          onClick={onCopy}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onCopy(e)}
          className={cn(
            "cursor-pointer select-none rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
            className,
          )}
        >
          {text}
        </span>
      </Tooltip>
      <span role="status" className="sr-only">
        {copied ? "Copied!" : ""}
      </span>
    </>
  );
}

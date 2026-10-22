import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * A read-only, Monaco-styled code area: Lightning renders logs and
 * dataclips in Monaco with its "default" theme (assets/js/monaco/index.tsx:
 * vs-dark base on gray-700, gray-600 current line). This draws the same
 * gutter, line height and colours without the editor. When the highlighted
 * lines change, the first one is scrolled into view, as the log viewer
 * revealed a selected step's lines.
 */
export default function CodeLines({
  lines,
  highlighted,
  className,
}: {
  /** Already-tokenised lines. */
  lines: ReactNode[];
  /** 1-based line numbers to mark with the yellow step bar. */
  highlighted?: Set<number>;
  className?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const first = highlighted?.size ? Math.min(...highlighted) : null;
  useEffect(() => {
    if (first === null) return;
    const row = scroller.current?.querySelector(`[data-line="${first}"]`);
    // jsdom has no scrollIntoView.
    if (row && typeof row.scrollIntoView === "function") row.scrollIntoView({ block: "start" });
  }, [first]);

  return (
    <div
      ref={scroller}
      className={cn("h-full overflow-auto bg-gray-700 text-sm/5 text-gray-200", className)}
      style={{ fontFamily: "'Fira Code', 'Fira Code VF', ui-monospace, monospace", fontVariantLigatures: "normal" }}
    >
      <div className="min-w-full w-max">
        {lines.map((line, i) => (
          <div key={i} data-line={i + 1} className={cn("flex", i === 0 && "bg-gray-600")}>
            {/* Monaco's line number gutter (lineNumbersMinChars: 3) */}
            <span
              className={cn(
                // eslint-disable-next-line no-restricted-syntax -- monospace column, sized in ch
                "w-[3ch] shrink-0 text-right select-none ml-[0.6ch]",
                i === 0 ? "text-gray-300" : "text-gray-400"
              )}
            >
              {i + 1}
            </span>
            {/* Line decorations column, where the step highlight bar sits. */}
            {/* eslint-disable-next-line no-restricted-syntax -- monospace column, sized in ch */}
            <span className="w-[2.6ch] shrink-0 relative">
              {highlighted?.has(i + 1) && <span className="absolute inset-y-0 left-1 w-0.5 bg-yellow-400" />}
            </span>
            <span className="whitespace-pre-wrap break-all pr-4">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

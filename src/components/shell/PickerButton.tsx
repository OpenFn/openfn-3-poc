import { cn } from "../../utils/cn";
import Tooltip from "../primitives/Tooltip";

interface Props {
  label: string;
  isSandbox?: boolean;
  /** Sandbox accent background. */
  sandboxColor?: string | null;
}

/**
 * The project picker trigger at the start of the breadcrumbs (Lightning's
 * assets/js/picker/PickerButton.tsx). Sandboxes render in their own colour
 * with a beaker, and a deep path is shortened to its last two parts.
 */
export default function PickerButton({ label, isSandbox = false, sandboxColor }: Props) {
  const parts = label.split("/");
  const truncated = isSandbox && parts.length > 2;
  const visible = truncated ? parts.slice(-2) : parts;

  const button = (
    // eslint-disable-next-line no-restricted-syntax -- debt: a secondary Button that takes the sandbox colour at runtime
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        // The project Picker listens for this event on document.body.
        document.body.dispatchEvent(new CustomEvent("open-project-picker"));
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm font-medium transition-colors",
        isSandbox
          ? "border-transparent text-inverse hover:opacity-90"
          : "border-strong bg-surface text-body hover:border-emphasis hover:bg-hover"
      )}
      style={isSandbox ? { backgroundColor: sandboxColor ?? "var(--color-primary-600)" } : undefined}
    >
      <span className={cn("h-4 w-4", isSandbox ? "hero-beaker text-white/80" : "hero-folder text-muted")} />
      <span>
        {isSandbox && parts.length > 1 ? (
          <>
            {truncated && <span className="opacity-50">…</span>}
            {visible.map((part, i) => (
              <span key={i}>
                {(i > 0 || truncated) && <span>:</span>}
                {part}
              </span>
            ))}
          </>
        ) : (
          label
        )}
      </span>
      <span className={cn("hero-chevron-down h-4 w-4 shrink-0", isSandbox ? "text-white/80" : "text-faint")} />
    </button>
  );
  return <Tooltip content={truncated ? parts.join(" > ") : undefined}>{button}</Tooltip>;
}

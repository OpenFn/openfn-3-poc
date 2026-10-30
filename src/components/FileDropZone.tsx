import { useId, useState, type DragEvent } from "react";
import { cn } from "../utils/cn";

/** Lightning's YAML import limit, applied to every upload here. */
const MAX_BYTES = 8 * 1024 * 1024;

interface Props {
  /** File types, as the input's `accept` (".json", ".yaml,.yml"). A picked or dropped file must match one by extension. */
  accept: string;
  /** Called with the picked or dropped file. Several dropped at once, or one over 8MB, show an error instead. */
  onFile: (file: File) => void;
  /** The zone's text and the file input's name: "Upload or drop a YAML file." */
  label: string;
  /** Smaller text under the label: "JSON, up to 8MB". */
  hint?: string;
  /** Shown in place of `hint` when a file doesn't match `accept`. */
  invalidMessage: string;
  className?: string;
}

/**
 * A dashed area that takes one file, by click, keyboard (the file input
 * inside it is focusable) or drag and drop.
 */
export default function FileDropZone({ accept, onFile, label, hint, invalidMessage, className }: Props) {
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const invalid = error !== "";
  const extensions = accept.split(",").map((ext) => ext.trim().toLowerCase());

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const problem =
      files.length > 1
        ? "Only 1 file can be uploaded"
        : !extensions.some((ext) => file.name.toLowerCase().endsWith(ext))
          ? invalidMessage
          : file.size > MAX_BYTES
            ? `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds maximum of 8MB`
            : "";
    setError(problem);
    if (!problem) onFile(file);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = (e: DragEvent) => {
    // Moving onto the icon or text inside fires dragleave too.
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    take(e.dataTransfer.files);
  };

  return (
    <label
      data-ui="file-drop-zone"
      data-dragging={dragging || undefined}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-strong p-3 text-center text-sm/6 text-muted transition-colors",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
        dragging
          ? "border-primary-500 bg-primary-50"
          : invalid
            ? "border-danger-400 bg-danger-50"
            : "hover:border-emphasis",
        className
      )}
    >
      <span className={cn("size-8", invalid ? "hero-exclamation-circle text-danger-600" : "hero-cloud-arrow-up text-faint")} />
      <input
        type="file"
        accept={accept}
        aria-label={label}
        aria-describedby={hint || invalid ? hintId : undefined}
        className="sr-only"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = "";
        }}
      />
      <span className="font-medium text-strong">{label}</span>
      {invalid ? (
        <span id={hintId} role="alert" className="text-xs/5 text-danger-600">
          {error}
        </span>
      ) : (
        hint && (
          <span id={hintId} className="text-xs/5">
            {hint}
          </span>
        )
      )}
    </label>
  );
}

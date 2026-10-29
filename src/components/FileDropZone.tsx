import { useId, useState, type DragEvent } from "react";
import { cn } from "../utils/cn";
import { FieldError } from "./Inputs";

interface Props {
  /** File types, as the input's `accept` (".json", ".yaml,.yml"). A dropped file must match one by extension. */
  accept: string;
  /** Called with the picked or dropped file (the first, if several are dropped). */
  onFile: (file: File) => void;
  /** The zone's text and the file input's name: "Upload or drop a YAML file." */
  label: string;
  /** Smaller text under the label: "JSON, up to 8MB". */
  hint?: string;
  /** Shown under the zone when a dropped file doesn't match `accept`. */
  invalidMessage: string;
  className?: string;
}

/**
 * A dashed area that takes one file, by click, keyboard (the file input
 * inside it is focusable) or drag and drop. Lightning's two uploaders
 * (manual-run-panel/FileUploader.tsx, yaml-import/YAMLFileDropzone.tsx).
 */
export default function FileDropZone({ accept, onFile, label, hint, invalidMessage, className }: Props) {
  const hintId = useId();
  const [dragging, setDragging] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const extensions = accept.split(",").map((ext) => ext.trim().toLowerCase());

  const take = (file: File | undefined) => {
    if (!file) return;
    const ok = extensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    setInvalid(!ok);
    if (ok) onFile(file);
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
    take(e.dataTransfer.files[0]);
  };

  return (
    <div data-ui="file-drop-zone" className={cn("flex flex-col", className)}>
      <label
        data-dragging={dragging || undefined}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-strong p-3 text-center text-sm/6 text-muted transition-colors",
          "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus",
          dragging ? "border-primary-500 bg-primary-50" : "hover:border-emphasis"
        )}
      >
        <span className="hero-cloud-arrow-up size-8 text-faint" />
        <input
          type="file"
          accept={accept}
          aria-label={label}
          aria-describedby={hint ? hintId : undefined}
          className="sr-only"
          onChange={(e) => {
            take(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span className="font-medium text-strong">{label}</span>
        {hint && (
          <span id={hintId} className="text-xs/5">
            {hint}
          </span>
        )}
      </label>
      {invalid && <FieldError>{invalidMessage}</FieldError>}
    </div>
  );
}

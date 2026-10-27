import type { DataclipBody } from "../../types/history";
import CodeViewer from "../CodeViewer";
import CopyButton from "../CopyButton";
import { EmptyState } from "../Table";

/**
 * A dataclip body in the dark code viewer (react/components/CodeViewer.tsx,
 * DataclipViewer.tsx): pretty-printed JSON in Monaco with a copy button in
 * the top-right corner. A body that could not be loaded shows its message
 * instead, with nothing to copy; undefined is an empty viewer, still loading.
 */
export default function JsonViewer({ body, ariaLabel = "Dataclip" }: { body: DataclipBody | undefined; ariaLabel?: string }) {
  if (body && "error" in body) {
    return (
      <div className="flex h-full items-center">
        <EmptyState variant="plain" icon="hero-exclamation-triangle" title={body.error} />
      </div>
    );
  }
  const content = body?.text ?? "";

  return (
    <div className="h-full relative">
      {content && <CopyButton value={content} size="sm" className="absolute top-3 right-3 z-10" />}
      <CodeViewer value={content} language="json" ariaLabel={ariaLabel} />
    </div>
  );
}

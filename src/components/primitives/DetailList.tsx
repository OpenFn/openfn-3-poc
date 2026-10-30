import { createContext, useContext, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import Heading from "./Heading";
import Text from "./Text";

type Layout = "rows" | "grid";
const LayoutContext = createContext<Layout>("rows");

/**
 * Labelled values. `rows` (default) is a divided list with the label left
 * and the value right (run_live `detail_list`); `grid` puts small uppercase
 * labels above their values in columns. `size="sm"` sets the rows in
 * 12px, for dense lists such as HTTP headers.
 */
export function DetailList({
  layout = "rows",
  size = "md",
  id,
  className,
  children,
}: {
  layout?: Layout;
  size?: "sm" | "md";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <LayoutContext.Provider value={layout}>
      <dl
        id={id}
        className={cn(
          size === "sm" ? "text-xs" : "text-sm",
          layout === "rows" ? "divide-y divide-subtle" : "grid grid-cols-2 gap-4 md:grid-cols-4",
          className
        )}
      >
        {children}
      </dl>
    </LayoutContext.Provider>
  );
}

/** One label and its value. `mono` sets the value in the code font. */
export function DetailItem({
  label,
  mono = false,
  className,
  valueClassName,
  children,
}: {
  label: ReactNode;
  mono?: boolean;
  className?: string;
  /** Extra classes for the value, e.g. `break-all`. */
  valueClassName?: string;
  children?: ReactNode;
}) {
  const layout = useContext(LayoutContext);
  if (layout === "grid") {
    return (
      <div className={className}>
        <Heading size="xs" as="dt">{label}</Heading>
        <Value mono={mono} className={cn("mt-1 wrap-break-words text-strong", valueClassName)}>{children}</Value>
      </div>
    );
  }
  return (
    <div className={cn("flex items-center justify-between gap-4 py-2", className)}>
      <dt className="font-medium text-muted">{label}</dt>
      <Value mono={mono} className={cn("text-right text-strong", valueClassName)}>{children}</Value>
    </div>
  );
}

// A plain value takes the list's size; a mono one is always code-sm.
function Value({ mono, className, children }: { mono: boolean; className: string; children?: ReactNode }) {
  if (mono) return <Text as="dd" variant="code-sm" className={className}>{children}</Text>;
  return <dd className={className}>{children}</dd>;
}

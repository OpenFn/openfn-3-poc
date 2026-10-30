import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export type HeadingSize = "xl" | "lg" | "md" | "sm" | "xs";

const sizes: Record<HeadingSize, string> = {
  xl: "text-3xl font-bold text-strong",
  lg: "text-lg font-semibold text-strong",
  md: "text-base font-semibold text-strong",
  sm: "text-sm font-medium text-strong",
  // The eyebrow: the small uppercase label that names a section.
  xs: "text-xs font-semibold uppercase tracking-wide text-muted",
};

/**
 * Every heading below the page title. Pick a `size` for the look and `as`
 * for the outline level; they're independent.
 */
export default function Heading({
  size = "md",
  as: Tag = "h3",
  id,
  className,
  children,
}: {
  size?: HeadingSize;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span" | "legend";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} data-ui="heading" data-size={size} className={cn(sizes[size], className)}>
      {children}
    </Tag>
  );
}

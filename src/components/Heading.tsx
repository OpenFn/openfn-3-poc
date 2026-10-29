import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type HeadingSize = "xl" | "lg" | "md" | "sm";

const sizes: Record<HeadingSize, string> = {
  xl: "text-3xl font-bold text-strong",
  lg: "text-lg font-semibold text-strong",
  md: "text-base font-semibold text-strong",
  sm: "text-sm font-semibold text-strong",
};

const eyebrow = "text-xs font-medium uppercase tracking-wide text-muted";

/**
 * Every heading below the page title. Pick a `size` for the look and `as`
 * for the outline level; they're independent. `variant="eyebrow"` is the
 * small uppercase label that names a section, and takes no `size`.
 */
export default function Heading({
  size = "md",
  variant = "default",
  as: Tag = "h3",
  id,
  className,
  children,
}: {
  size?: HeadingSize;
  variant?: "default" | "eyebrow";
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const isEyebrow = variant === "eyebrow";
  return (
    <Tag
      id={id}
      data-ui="heading"
      data-variant={variant}
      className={cn(isEyebrow ? eyebrow : sizes[size], className)}
    >
      {children}
    </Tag>
  );
}

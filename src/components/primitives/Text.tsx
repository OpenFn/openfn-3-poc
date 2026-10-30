import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

// The type scale: a role (body, label, code) at a size (md 14px, sm 12px),
// and the big number a card or chart is about (stat, at 30, 24 and 18px).
// Headings are Heading; everything else is one of these.
const variants = {
  "body-md": "text-sm",
  "body-sm": "text-xs",
  "label-md": "text-sm font-medium",
  "label-sm": "text-xs font-medium",
  "code-md": "font-mono text-sm",
  "code-sm": "font-mono text-xs",
  "stat-lg": "text-3xl font-bold",
  "stat-md": "text-2xl font-semibold",
  "stat-sm": "text-lg",
};

export type TextVariant = keyof typeof variants;

/**
 * Any text that isn't a heading. `variant` names what the text is and how
 * big; colour stays a class (`text-muted`, `text-faint`). It can wrap a block
 * of copy as well as a line: `<Text as="div" className="space-y-3">`. Inside
 * it, bold, italic and code keep its size: `font-medium`, `italic`, `<code>`.
 */
export default function Text({
  variant = "body-md",
  as: Tag = "span",
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  variant?: TextVariant;
  as?: "span" | "p" | "div" | "dt" | "dd" | "pre" | "ul" | "kbd";
}) {
  return <Tag {...rest} data-ui="text" data-variant={variant} className={cn(variants[variant], className)} />;
}

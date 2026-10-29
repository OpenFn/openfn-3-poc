import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";
import Button, { type ButtonLook, type ButtonSize } from "./Button";

type Props = Omit<ComponentProps<typeof Button>, "children" | "icon" | "tooltip" | "title" | "variant" | "tone"> & {
  /** Hero icon class, e.g. `hero-x-mark`, or an icon element of your own (an SVG). */
  icon: string | ReactNode;
  /** Accessible name, also shown as the hover tooltip. */
  label: string;
  /** Hover text when it should say more than the label (a shortcut, why it's disabled); `false` for none. */
  tooltip?: string | false | undefined;
  /** Shows a toggle as on, e.g. an open panel. Sets `aria-pressed`. */
  active?: boolean | undefined;
} & (
    | { variant?: "plain" | "primary" | undefined; tone?: "danger" | undefined }
    | { variant: "secondary"; tone?: never }
  );

// A square as tall as a Button of the same size (28, 32, 36, 40px), so it lines up beside one.
const sizes: Record<ButtonSize, { button: string; icon: string }> = {
  xs: { button: "size-7", icon: "h-4 w-4" },
  sm: { button: "size-8", icon: "h-5 w-5" },
  md: { button: "size-9", icon: "h-5 w-5" },
  lg: { button: "size-10", icon: "h-6 w-6" },
};

/**
 * A square Button showing only an icon: close buttons, panel toggles, row
 * actions. Colours, focus, disabled, pending, links and the size scale all
 * come from Button; it defaults to `variant="plain"` and `size="sm"`. Always
 * give it a `label`.
 */
export default function IconButton({ icon, label, size = "sm", tooltip, active, variant = "plain", tone, className, ...rest }: Props) {
  const s = sizes[size];
  const look = { variant, tone } as ButtonLook;
  return (
    <Button
      {...rest}
      {...look}
      size={size}
      icon={typeof icon === "string" ? <span className={cn(icon, s.icon)} aria-hidden="true" /> : icon}
      aria-label={label}
      aria-pressed={active}
      tooltip={tooltip === false ? undefined : (tooltip ?? label)}
      className={cn("shrink-0 p-0", s.button, className)}
    >
      {null}
    </Button>
  );
}

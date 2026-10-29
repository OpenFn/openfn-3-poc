import type { ComponentProps, ReactNode } from "react";
import { cn } from "../utils/cn";
import Button, { type ButtonLook } from "./Button";

export type IconButtonSize = "sm" | "md" | "lg";

type Props = Omit<ComponentProps<typeof Button>, "children" | "icon" | "size" | "tooltip" | "title" | "variant" | "tone"> & {
  /** Hero icon class, e.g. `hero-x-mark`, or an icon element of your own (an SVG). */
  icon: string | ReactNode;
  /** Accessible name, also shown as the hover tooltip. */
  label: string;
  size?: IconButtonSize | undefined;
  /** Hover text when it should say more than the label (a shortcut, why it's disabled); `false` for none. */
  tooltip?: string | false | undefined;
  /** Shows a toggle as on, e.g. an open panel. Sets `aria-pressed`. */
  active?: boolean | undefined;
} & (
    | { variant?: "plain" | "primary" | undefined; tone?: "danger" | undefined }
    | { variant: "secondary"; tone?: never }
  );

const sizes: Record<IconButtonSize, { button: string; icon: string }> = {
  sm: { button: "p-0.5", icon: "h-4 w-4" },
  md: { button: "p-1", icon: "h-5 w-5" },
  lg: { button: "p-1.5", icon: "h-6 w-6" },
};

/**
 * A square Button showing only an icon: close buttons, panel toggles, row
 * actions. Colours, focus, disabled, pending and links all come from Button;
 * it defaults to `variant="plain"`. Always give it a `label`.
 */
export default function IconButton({ icon, label, size = "md", tooltip, active, variant = "plain", tone, className, ...rest }: Props) {
  const s = sizes[size];
  const look = { variant, tone } as ButtonLook;
  return (
    <Button
      {...rest}
      {...look}
      size="sm"
      icon={typeof icon === "string" ? <span className={cn(icon, s.icon)} aria-hidden="true" /> : icon}
      aria-label={label}
      aria-pressed={active}
      tooltip={tooltip === false ? undefined : (tooltip ?? label)}
      className={cn("shrink-0", s.button, className)}
    >
      {null}
    </Button>
  );
}

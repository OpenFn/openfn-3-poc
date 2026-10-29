import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { Link } from "../routing/router";
import { cn } from "../utils/cn";
import Spinner from "./Spinner";
import Tooltip from "./Tooltip";
import type { Tone } from "./tone";

export type ButtonVariant = "primary" | "secondary" | "plain";
export type ButtonTone = Extract<Tone, "danger" | "success">;
export type ButtonSize = "xs" | "sm" | "md" | "lg";

// The minimum height is a text button's height (28, 32, 36, 40px), so a button holding only an
// icon is as tall as the text buttons beside it. A minimum, so a label that wraps still fits.
const sizeClasses: Record<ButtonSize, string> = {
  xs: "min-h-7 px-2 py-1",
  sm: "min-h-8 px-2.5 py-1.5",
  md: "min-h-9 px-3 py-2",
  lg: "min-h-10 px-3.5 py-2.5",
};

const iconClasses: Record<ButtonSize, string> = { xs: "h-4 w-4", sm: "h-4 w-4", md: "h-4 w-4", lg: "h-5 w-5" };

// Lightning's button colours, keyed by the tone if there is one, else the variant. `plain` is
// text on nothing: hover darkens the text only, so an icon sits on any surface, white or grey.
// Text needs a white surface: on the grey page plain (4.39:1) and plain danger (4.33:1) fall
// below 4.5:1. A pressed toggle (`aria-pressed`) gets a tint. Disabled has no hover: filled looks turn their
// 300 shade with white text, secondary goes grey, and plain is faded to half strength, as
// Lightning draws them (`new_inputs.ex` button, the editor's Run / Retry). Plain writes its
// hover as `hover:` with `disabled:` undoing it, so a caller's own `hover:` colour replaces it;
// a `not-disabled:hover:` class would outrank it.
const lookClasses = {
  primary: "bg-primary-600 not-disabled:hover:bg-primary-500 disabled:bg-primary-300 text-inverse shadow-xs",
  secondary:
    "bg-surface not-disabled:hover:bg-hover text-strong ring-1 ring-strong ring-inset shadow-xs disabled:bg-subtle disabled:text-faint disabled:ring-subtle",
  plain:
    "text-muted hover:text-body disabled:text-muted disabled:opacity-50 aria-pressed:bg-primary-50 aria-pressed:text-primary-600",
  danger: "bg-danger-600 not-disabled:hover:bg-danger-500 disabled:bg-danger-300 text-inverse shadow-xs",
  success: "bg-success-600 not-disabled:hover:bg-success-500 disabled:bg-success-300 text-inverse shadow-xs",
  "plain-danger": "text-danger-600 hover:text-danger-700 disabled:text-danger-600 disabled:opacity-50",
};

function buttonClasses(look: keyof typeof lookClasses, size: ButtonSize = "md", className?: string) {
  return cn(
    "rounded-md text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus inline-flex items-center justify-center gap-x-1.5 disabled:cursor-not-allowed",
    sizeClasses[size],
    lookClasses[look],
    className
  );
}

interface BaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: ButtonSize | undefined;
  /** Render as a router link instead of a <button>. */
  to?: string;
  /** Render as a plain link (external pages, downloads, SSO handlers). */
  href?: string;
  /** Link-only: save the target instead of opening it. */
  download?: AnchorHTMLAttributes<HTMLAnchorElement>["download"];
  /** Link-only: e.g. `_blank`. */
  target?: string;
  rel?: string;
  /** Shown on hover (often why it's disabled). */
  tooltip?: string | undefined;
  /**
   * The action is in flight: the button is disabled and shows a spinner
   * before its label. Pass `useAction().pending` or let `FormModal` /
   * `ConfirmModal` manage it.
   */
  pending?: boolean;
  /** A hero icon class (e.g. `hero-plus`), sized to the button, or an icon element of your own. The spinner takes its place while `pending`. */
  icon?: ReactNode;
  /** Which side of the label the icon goes: `left` (the default), or `right` for an arrow or a menu's chevron. Does nothing without an `icon`. */
  iconPosition?: "left" | "right" | undefined;
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

// Nothing draws a red or green secondary, or a green plain button.
export type ButtonLook =
  | { variant?: "primary" | undefined; tone?: ButtonTone | undefined }
  | { variant: "secondary"; tone?: never }
  | { variant: "plain"; tone?: "danger" | undefined };

type Props = BaseProps & ButtonLook;

/**
 * Pass `to` or `href` to get a link that looks the same; disabled, it's a
 * plain disabled button. `pending` disables it and shows a spinner while a
 * request runs (STANDARDS.md pattern 1). `xs` is the table row action.
 * `variant="plain"` is text with no fill or border, IconButton's default.
 */
export default function Button({
  variant = "primary",
  tone,
  size = "md",
  to,
  href,
  tooltip,
  pending = false,
  disabled: disabledProp = false,
  className,
  type = "button",
  id,
  download,
  target,
  rel,
  icon,
  iconPosition = "left",
  ref,
  children,
  ...rest
}: Props) {
  const disabled = disabledProp || pending;
  const classes = buttonClasses(variant === "plain" && tone ? "plain-danger" : (tone ?? variant), size, className);
  const shared = {
    id,
    className: classes,
    "data-ui": "button",
    "data-variant": variant,
    "data-tone": tone,
    "aria-busy": pending || undefined,
  };
  const iconEl = pending ? (
    <Spinner size={size === "xs" ? "xs" : "sm"} label="Working" />
  ) : typeof icon === "string" ? (
    <span className={cn(icon, iconClasses[size], "shrink-0")} aria-hidden="true" />
  ) : (
    icon
  );
  // Without an icon the spinner goes before the label.
  const right = iconPosition === "right" && icon != null;
  const content = (
    <>
      {!right && iconEl}
      {children}
      {right && iconEl}
    </>
  );
  // Links take the same handlers and aria props as buttons.
  const link = { ...(rest as AnchorHTMLAttributes<HTMLAnchorElement>), ...shared, target, rel: rel ?? (target === "_blank" ? "noreferrer" : undefined) };
  const wrap = (el: ReactElement) => (
    <Tooltip content={tooltip} disabled={disabled && !pending}>
      {el}
    </Tooltip>
  );
  if (to && !disabled) {
    return wrap(
      <Link to={to} {...link}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return wrap(
      <a href={href} download={download} {...link}>
        {content}
      </a>
    );
  }
  return wrap(
    <button ref={ref} type={type} disabled={disabled} {...shared} {...rest}>
      {content}
    </button>
  );
}

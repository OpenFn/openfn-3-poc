import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { Link } from "../routing/router";
import { cn } from "../utils/cn";
import Spinner from "./Spinner";
import Tooltip from "./Tooltip";

export type ButtonTheme = "primary" | "secondary" | "danger" | "success" | "warning";
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2 py-1",
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2",
  lg: "px-3.5 py-2.5",
};

// Lightning's new_inputs.ex button_theme_classes, enabled vs disabled. Each theme gives its focus
// outline a colour; Lightning's secondary has none, so here it uses primary.
const themeClasses: Record<ButtonTheme, { enabled: string; disabled: string }> = {
  primary: {
    enabled:
      "bg-primary-600 hover:bg-primary-500 text-inverse focus-visible:outline-focus",
    disabled: "bg-primary-300 text-inverse",
  },
  secondary: {
    enabled: "bg-surface hover:bg-hover text-strong ring-1 ring-strong ring-inset focus-visible:outline-focus",
    disabled: "bg-subtle text-faint ring-1 ring-subtle ring-inset",
  },
  danger: {
    enabled:
      "bg-danger-600 hover:bg-danger-500 text-inverse focus-visible:outline-danger-600",
    disabled: "bg-danger-300 text-inverse",
  },
  success: {
    enabled:
      "bg-success-600 hover:bg-success-500 text-inverse focus-visible:outline-success-600",
    disabled: "bg-success-300 text-inverse",
  },
  warning: {
    enabled:
      "bg-warning-600 hover:bg-warning-500 text-inverse focus-visible:outline-warning-600",
    disabled: "bg-warning-300 text-inverse",
  },
};

function buttonClasses(theme: ButtonTheme, size: ButtonSize = "md", disabled = false, className?: string) {
  return cn(
    "rounded-md text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 phx-submit-loading:opacity-75 inline-flex items-center justify-center gap-x-1.5",
    sizeClasses[size],
    themeClasses[theme][disabled ? "disabled" : "enabled"],
    disabled && "cursor-not-allowed",
    className
  );
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  theme?: ButtonTheme;
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
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

/**
 * The button: rounded-md, text-sm font-semibold, shadow-xs, with primary /
 * secondary / danger / success / warning themes and xs / sm / md / lg padding
 * (xs is the small row action in a table).
 * Pass `to` or `href` to get a link that looks the same. `pending` disables
 * it and shows a spinner while a request runs (STANDARDS.md pattern 1).
 */
export default function Button({
  theme = "primary",
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
  ref,
  children,
  ...rest
}: Props) {
  const disabled = disabledProp || pending;
  const classes = buttonClasses(theme, size, disabled, className);
  const shared = {
    id,
    className: classes,
    "data-ui": "button",
    "data-variant": theme,
    "data-pending": pending || undefined,
    "aria-busy": pending || undefined,
  };
  const content = (
    <>
      {pending && <Spinner size={size === "xs" ? "xs" : "sm"} label="Working" />}
      {children}
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
        {children}
      </Link>
    );
  }
  if (href && !disabled) {
    return wrap(
      <a href={href} download={download} {...link}>
        {children}
      </a>
    );
  }
  return wrap(
    <button ref={ref} type={type} disabled={disabled} {...shared} {...rest}>
      {content}
    </button>
  );
}

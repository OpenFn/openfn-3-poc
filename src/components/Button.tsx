import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { Link } from "../routing/router";
import { cn } from "../utils/cn";
import Spinner from "./Spinner";
import Tooltip from "./Tooltip";
import type { Tone } from "./tone";

export type ButtonVariant = "primary" | "secondary" | "plain";
export type ButtonTone = Extract<Tone, "danger" | "success">;
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2 py-1",
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2",
  lg: "px-3.5 py-2.5",
};

const iconClasses: Record<ButtonSize, string> = { xs: "h-4 w-4", sm: "h-4 w-4", md: "h-5 w-5", lg: "h-5 w-5" };

// Lightning's button colours, keyed by the tone if there is one, else the variant. `plain` is
// text on nothing, with a background on hover and while pressed (`aria-pressed`). Disabled is
// the same colour at half strength for every look, with no hover.
const lookClasses = {
  primary: "bg-primary-600 not-disabled:hover:bg-primary-500 text-inverse shadow-xs",
  secondary: "bg-surface not-disabled:hover:bg-hover text-strong ring-1 ring-strong ring-inset shadow-xs",
  plain:
    "text-muted not-disabled:hover:bg-hover not-disabled:hover:text-body aria-pressed:bg-primary-50 aria-pressed:text-primary-600",
  danger: "bg-danger-600 not-disabled:hover:bg-danger-500 text-inverse shadow-xs",
  success: "bg-success-600 not-disabled:hover:bg-success-500 text-inverse shadow-xs",
  "plain-danger": "text-danger-600 not-disabled:hover:bg-danger-50 not-disabled:hover:text-danger-700",
};

function buttonClasses(look: keyof typeof lookClasses, size: ButtonSize = "md", className?: string) {
  return cn(
    "rounded-md text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus inline-flex items-center justify-center gap-x-1.5 disabled:cursor-not-allowed disabled:opacity-50",
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
  /** A hero icon class (e.g. `hero-plus`) shown before the label, sized to the button, or an icon element of your own. The spinner takes its place while `pending`. */
  icon?: string | ReactElement | undefined;
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
  const content = (
    <>
      {pending ? (
        <Spinner size={size === "xs" ? "xs" : "sm"} label="Working" />
      ) : typeof icon === "string" ? (
        <span className={cn(icon, iconClasses[size], "shrink-0")} aria-hidden="true" />
      ) : (
        icon
      )}
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

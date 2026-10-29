import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactElement, ReactNode, Ref } from "react";
import { Link } from "../routing/router";
import { cn } from "../utils/cn";
import Spinner from "./Spinner";
import Tooltip from "./Tooltip";
import type { Tone } from "./tone";

export type ButtonVariant = "primary" | "secondary";
export type ButtonTone = Extract<Tone, "danger" | "success">;
export type ButtonSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<ButtonSize, string> = {
  xs: "px-2 py-1",
  sm: "px-2.5 py-1.5",
  md: "px-3 py-2",
  lg: "px-3.5 py-2.5",
};

// Lightning's button colours, keyed by the tone if there is one, else the variant. Each gives its
// focus outline a colour; Lightning's secondary has none, so here it uses primary. Disabled is the
// same colour at half strength for every look, with no hover.
const lookClasses: Record<ButtonVariant | ButtonTone, string> = {
  primary:
    "bg-primary-600 not-disabled:hover:bg-primary-500 text-inverse focus-visible:outline-focus",
  secondary:
    "bg-surface not-disabled:hover:bg-hover text-strong ring-1 ring-strong ring-inset focus-visible:outline-focus",
  danger:
    "bg-danger-600 not-disabled:hover:bg-danger-500 text-inverse focus-visible:outline-danger-600",
  success:
    "bg-success-600 not-disabled:hover:bg-success-500 text-inverse focus-visible:outline-success-600",
};

function buttonClasses(look: ButtonVariant | ButtonTone, size: ButtonSize = "md", className?: string) {
  return cn(
    "rounded-md text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 inline-flex items-center justify-center gap-x-1.5 disabled:cursor-not-allowed disabled:opacity-50",
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
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

// A tone colours the filled button only: nothing draws a red or green secondary.
type Look =
  | { variant?: "primary" | undefined; tone?: ButtonTone | undefined }
  | { variant: "secondary"; tone?: never };

type Props = BaseProps & Look;

/**
 * Pass `to` or `href` to get a link that looks the same; disabled, it's a
 * plain disabled button. `pending` disables it and shows a spinner while a
 * request runs (STANDARDS.md pattern 1). `xs` is the table row action.
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
  ref,
  children,
  ...rest
}: Props) {
  const disabled = disabledProp || pending;
  const classes = buttonClasses(tone ?? variant, size, className);
  const shared = {
    id,
    className: classes,
    "data-ui": "button",
    "data-variant": variant,
    "data-tone": tone,
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

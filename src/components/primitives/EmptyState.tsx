import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import Text from "./Text";

/**
 * "Nothing here yet" (table.ex `empty_state`): a dashed box, or with
 * `variant="plain"` just the centred text, for inside a card or list. With
 * `buttonText` the dashed box is a button that starts the create flow.
 * `children` go below the message (e.g. an error code). `fill` centres it in
 * the box it sits in; `loading` pulses it while the content is on its way.
 */
export default function EmptyState({
  id,
  variant = "dashed",
  icon = variant === "dashed" ? "hero-plus-circle" : undefined,
  title,
  message,
  buttonText,
  onClick,
  disabled,
  fill = false,
  loading = false,
  className,
  children,
}: {
  /** The box's id (the button's, when it is one), for hosts that address it. */
  id?: string | undefined;
  variant?: "dashed" | "plain";
  /** A Heroicon class; `null` for none on a dashed box. */
  icon?: string | null;
  title?: ReactNode;
  message?: ReactNode;
  buttonText?: string;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  /** Fill the panel or card it sits in and centre in it. */
  fill?: boolean;
  /** Still on its way: pulses, and is announced as a status. */
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const plain = variant === "plain";
  const body = (
    <>
      {icon && <span className={cn(icon, "mx-auto mb-2 block h-6 w-6 text-faint")} />}
      {buttonText && (
        <Text variant="label-md" className="block text-muted">
          {buttonText}
        </Text>
      )}
      {title && (
        <Text variant="label-md" className="block text-strong">
          {title}
        </Text>
      )}
      {message && (
        <Text as="div" className={cn("text-muted", (title || buttonText) && "mt-1")}>
          {message}
        </Text>
      )}
      {children && <div className="mt-2">{children}</div>}
    </>
  );
  const classes = cn(
    "relative w-full text-center",
    fill ? "flex h-full flex-col items-center justify-center" : "block",
    loading && "animate-pulse",
    "px-4 py-6",
    !plain && "rounded-lg border-2 border-dashed border-strong",
    className
  );
  if (buttonText && !plain) {
    return (
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-ui="empty-state"
        data-variant={variant}
        className={cn(classes, "hover:border-emphasis disabled:hover:border-strong focus:outline-none")}
      >
        {body}
      </button>
    );
  }
  return (
    <div id={id} data-ui="empty-state" data-variant={variant} role={loading ? "status" : undefined} className={classes}>
      {body}
    </div>
  );
}

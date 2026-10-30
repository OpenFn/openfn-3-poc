import { useRef, type FormHTMLAttributes, type ReactNode, type SubmitEvent } from "react";
import { flushSync } from "react-dom";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";
import Alert from "./Alert";
import { useFocusFirstError } from "./focusFirstError";
import { FormPendingContext } from "./formStatus";

interface Props extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children"> {
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  /** A failure for the whole form, not one field (a field's errors go on its Field). Shown above the buttons. */
  error?: unknown;
  /** While saving: marks the form busy, and a submit button inside shows it's working. */
  pending?: boolean | undefined;
  /**
   * The buttons that end the form, main action last: `<><Button variant="secondary">Cancel</Button><Button type="submit">Save</Button></>`.
   * Leave it out when the container places its own button, as the sign-in cards do (full width).
   */
  actions?: ReactNode;
  /** Only for placement, e.g. `w-1/2`. */
  className?: string | undefined;
  children: ReactNode;
}

/**
 * One thing you save: the fields stacked with one gap, the form's own error,
 * then its buttons on the right with the main action last. A page passes the
 * fields and the buttons; it never lays them out. Modals use `FormModal`,
 * whose footer places the buttons the same way.
 *
 * Only the fields' own errors show: the browser's required-field bubbles are
 * off. After a Save that fails, our checks or the server's, focus moves to
 * the first field with an error, so keyboard and screen-reader users land on it.
 */
export default function Form({ onSubmit, error, pending = false, actions, className, children, ...rest }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const focus = useFocusFirstError(ref, pending);

  return (
    <form
      {...rest}
      ref={ref}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        // Our own checks: flushSync puts their errors on screen before we look for them.
        // A Save that started saving (the form is busy) passed them, so an old server error mustn't take focus.
        flushSync(() => onSubmit(e));
        focus.submitted();
      }}
      aria-busy={pending || undefined}
      className={cn("space-y-6", className)}
    >
      <FormPendingContext.Provider value={pending}>
        {children}
        {error != null && error !== false && <Alert tone="danger">{errorMessage(error)}</Alert>}
        {actions && (
          <div data-ui="form-actions" className="flex justify-end gap-2">
            {actions}
          </div>
        )}
      </FormPendingContext.Provider>
    </form>
  );
}

import { useEffect, useRef, type FormHTMLAttributes, type ReactNode, type SubmitEvent } from "react";
import { flushSync } from "react-dom";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";
import Alert from "./Alert";
import { FormPendingContext } from "./formStatus";

interface Props extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children"> {
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  /** A failure for the whole form, not one field (a field's errors go on its Field). Shown above the buttons. */
  error?: unknown;
  /** While saving: marks the form busy, and a submit button inside shows it's working. */
  pending?: boolean | undefined;
  /** The buttons that end the form, main action last: `<><Button variant="secondary">Cancel</Button><Button type="submit">Save</Button></>`. */
  actions: ReactNode;
  /** Only for placement, e.g. `w-1/2`. */
  className?: string | undefined;
  children: ReactNode;
}

const focusFirstError = (form: HTMLFormElement | null) => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();

/** Focus is still where Save left it: on the form's buttons, or nowhere. Then moving it takes nothing from the user. */
const focusUnmoved = (form: HTMLFormElement | null) => {
  const active = document.activeElement;
  return active === document.body || Boolean(form?.querySelector('[data-ui="form-actions"]')?.contains(active));
};

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
  const wasPending = useRef(false);

  // The server's errors arrive when saving ends, after the event is over, so an
  // effect watches for that; by the time it runs they're on screen.
  useEffect(() => {
    if (wasPending.current && !pending && focusUnmoved(ref.current)) focusFirstError(ref.current);
    wasPending.current = pending;
  }, [pending]);

  return (
    <form
      {...rest}
      ref={ref}
      noValidate
      onSubmit={(e) => {
        // Our own checks: flushSync puts their errors on screen before we look for them.
        // A Save that started saving (the form is busy) passed them, so an old server error mustn't take focus.
        flushSync(() => onSubmit(e));
        if (ref.current?.getAttribute("aria-busy") !== "true") focusFirstError(ref.current);
      }}
      aria-busy={pending || undefined}
      className={cn("space-y-6", className)}
    >
      <FormPendingContext.Provider value={pending}>
        {children}
        {error != null && error !== false && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <div data-ui="form-actions" className="flex justify-end gap-2">
          {actions}
        </div>
      </FormPendingContext.Provider>
    </form>
  );
}

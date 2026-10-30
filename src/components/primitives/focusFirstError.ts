import { useEffect, useRef, type RefObject } from "react";

/**
 * After a refused Save, focus goes to the first field with an error, so
 * keyboard and screen-reader users land on it. A field is "with an error"
 * when Field has marked it `aria-invalid`.
 */
function focusFirstError(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

/**
 * Focus after Save. Call `submitted()` in the submit handler, after the
 * handler ran under `flushSync`:
 * - if the form isn't busy, our own checks refused the Save: focus its first
 *   error straight away (`Form`);
 * - if it's busy, wait for saving to end, then focus the first error, if
 *   there is one and the user hasn't moved focus since pressing Save. That
 *   covers the server's errors, and `FormModal`, whose action marks itself
 *   busy before running its checks, so its refusals arrive this way too.
 *
 * "Busy" is read from the form's `aria-busy`, which `Form` and `FormModal`
 * set from their pending state; the pending value in the handler is from the
 * render before. Keep that attribute in step with pending, or focus breaks.
 */
export function useFocusFirstError(form: RefObject<HTMLFormElement | null>, pending: boolean) {
  const focusAtSubmit = useRef<Element | null>(null);
  const wasPending = useRef(false);

  // The server's errors arrive after the submit event is over, so an effect
  // watches for saving to end; by the time it runs they're on screen.
  useEffect(() => {
    const unmoved = document.activeElement === focusAtSubmit.current || document.activeElement === document.body;
    if (wasPending.current && !pending && unmoved) focusFirstError(form.current);
    wasPending.current = pending;
  }, [form, pending]);

  return {
    submitted: () => {
      focusAtSubmit.current = document.activeElement;
      if (form.current?.getAttribute("aria-busy") !== "true") focusFirstError(form.current);
    },
  };
}

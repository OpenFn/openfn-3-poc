import { useEffect, useRef, type RefObject } from "react";

/**
 * After a refused Save, focus goes to the first field with an error, so
 * keyboard and screen-reader users land on it. `Form` and `FormModal` share
 * this. A field is "with an error" when Field has marked it `aria-invalid`.
 */
function focusFirstError(form: HTMLFormElement | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

/**
 * Focus after Save. Call `submitted()` in the submit handler, after the
 * handler ran under `flushSync`:
 * - a Save our own checks refused (the form isn't busy) focuses its first
 *   error straight away;
 * - a Save that went to the server focuses the first error when saving ends,
 *   if the server sent errors back and the user hasn't moved focus since
 *   pressing Save.
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

/**
 * Whether a control refuses presses: natively `disabled`, or `aria-disabled` where it keeps
 * focus (a pending Button, or a disabled control whose tooltip says why).
 */
export const isDisabled = (el: Element | null) =>
  !!el && ((el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true");

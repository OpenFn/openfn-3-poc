import { useEffect, useRef } from "react";

/**
 * When a gate swaps its page for a spinner, the control focus would return to
 * goes with it. Once the new page is in, give focus to <main> (Layout) rather
 * than leave it on <body> (WCAG 2.4.3). Not on the first load, when nothing
 * was swapped out, unless `arrived`: the person came here from another page
 * (signing in), so the first load is a swap too. `arrived` is read on mount.
 */
export function useFocusMainAfterSwap(loading: boolean, arrived = false) {
  const shown = useRef(false);
  const swapped = useRef(arrived);
  useEffect(() => {
    if (loading) {
      if (shown.current) swapped.current = true;
      return;
    }
    if (swapped.current && document.activeElement === document.body) document.querySelector<HTMLElement>("main")?.focus();
    swapped.current = false;
    shown.current = true;
  }, [loading]);
}

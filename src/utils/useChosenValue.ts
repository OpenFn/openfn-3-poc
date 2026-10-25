import { useState } from "react";

/**
 * A control the host saves on every change (a switch, a select). It shows
 * the user's choice at once and keeps it while the request runs, as a native
 * control does in Lightning before the server re-renders. A failed save puts
 * back the saved value and calls `onError`; new props from the host always
 * replace the choice.
 */
export function useChosenValue<T>(saved: T, save: (value: T) => Promise<void>, onError: (error: unknown) => void) {
  const [chosen, setChosen] = useState<{ value: T } | null>(null);
  // A new value from the host clears the choice, so it can't come back later.
  const [lastSaved, setLastSaved] = useState(saved);
  if (!Object.is(lastSaved, saved)) {
    setLastSaved(saved);
    setChosen(null);
  }
  const value = chosen ? chosen.value : saved;
  const choose = (next: T) => {
    const choice = { value: next };
    setChosen(choice);
    save(next).catch((error: unknown) => {
      // Only undo this choice, not a later one made while it was in flight.
      setChosen((c) => (c === choice ? null : c));
      onError(error);
    });
  };
  return { value, choose };
}

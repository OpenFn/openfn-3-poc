import { useState } from "react";
import type { Flash } from "@/types/auth";

/**
 * What a signed-out page's `AuthCard` shows: the refusal if there is one,
 * else the message a redirect carried here, as an error or info by its tone.
 * Once a submit is refused the carried message stays gone, as Lightning
 * re-renders with only the new flash.
 */
export function useCarriedFlash(flash: Flash | null, refused: boolean, error: string | undefined) {
  const [replaced, setReplaced] = useState(false);
  if (refused && !replaced) setReplaced(true);
  const carried = replaced ? null : flash;
  return {
    error: error ?? (carried?.tone === "danger" ? carried.message : undefined),
    info: carried?.tone === "info" ? carried.message : undefined,
  };
}

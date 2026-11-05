import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { Flash } from "@/types/auth";

/**
 * A message that survives a redirect ("Logged out successfully."). The
 * `.query` that navigates sets it: `navigate(to, { state: { flash } })`.
 * This reads it once and clears it from the history entry, so a reload or
 * Back doesn't show it again. Clearing empties `location.state`, so the
 * message is copied into state, where the caller keeps it until it unmounts.
 * A caller that stays mounted (SessionGate) gets each later one as it arrives.
 */
export function useFlash(): Flash | null {
  const { pathname, search, hash, state } = useLocation();
  const navigate = useNavigate();
  const incoming = (state as { flash?: Flash } | null)?.flash ?? null;
  const [flash, setFlash] = useState(incoming);
  if (incoming && incoming !== flash) setFlash(incoming);
  useEffect(() => {
    if (incoming) void navigate(pathname + search + hash, { replace: true, state: null });
  }, [incoming, navigate, pathname, search, hash]);
  return flash;
}

import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigationType } from "react-router-dom";
import { useSession } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { useToast } from "@/components/primitives/Toast";
import { useFlash } from "@/routing/flash";
import SessionProvider from "@/session/SessionProvider";
import type { Flash } from "@/types/auth";
import { useFocusMainAfterSwap } from "@/utils/useFocusMainAfterSwap";

/**
 * The parent of every signed-in route. Loads the session, the user and the
 * instance, and renders the page only once they're there. Signed out, it goes
 * to log in and comes back here after (`return_to`); a session still owing an
 * MFA code or an email confirmation goes to that page instead.
 */
export default function SessionGate() {
  const { pathname, search, hash } = useLocation();
  const here = encodeURIComponent(pathname + search + hash);
  const { status, state, session } = useSession();
  // Arriving from another page: sign-in, two-factor, or a signed-out page's
  // redirect. Opening, reloading and Back are POPs. (A reload keeps the
  // entry's key, so the key can't tell an arrival from a reload.)
  const arrived = useNavigationType() !== "POP";
  useFocusMainAfterSwap(status.state === "loading", arrived);
  if (state === "signed_out") return <Navigate to={`/users/log_in?return_to=${here}`} replace />;
  if (state === "mfa_required") return <Navigate to={`/users/two-factor?return_to=${here}`} replace />;
  if (state === "confirmation_required") return <Navigate to="/users/confirm-required" replace />;
  return (
    <AsyncBoundary status={status} titleAs="h1">
      {session && (
        <SessionProvider session={session}>
          <FlashToast />
          <Outlet />
        </SessionProvider>
      )}
    </AsyncBoundary>
  );
}

/**
 * A message a redirect carried into the app shows as a toast. Rendered only
 * once signed in, so it isn't toasted on the way to log in.
 */
function FlashToast() {
  const toast = useToast();
  const flash = useFlash();
  // StrictMode runs effects twice: toast each message once. Keyed on the message,
  // not the entry: clearing it replaces the entry, which gives it a new key.
  const toasted = useRef<Flash | null>(null);
  useEffect(() => {
    if (!flash || toasted.current === flash) return;
    toasted.current = flash;
    toast(flash.message, flash.tone);
  }, [flash, toast]);
  return null;
}

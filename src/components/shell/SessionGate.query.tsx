import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import SessionProvider from "@/session/SessionProvider";

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
  if (state === "signed_out") return <Navigate to={`/users/log_in?return_to=${here}`} replace />;
  if (state === "mfa_required") return <Navigate to={`/users/two-factor?return_to=${here}`} replace />;
  if (state === "confirmation_required") return <Navigate to="/users/confirm-required" replace />;
  return (
    <AsyncBoundary status={status} titleAs="h1">
      {session && (
        <SessionProvider session={session}>
          <Outlet />
        </SessionProvider>
      )}
    </AsyncBoundary>
  );
}

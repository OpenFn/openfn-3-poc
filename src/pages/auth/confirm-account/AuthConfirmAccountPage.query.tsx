import { useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useConfirmationSaves } from "@/api/confirmations";
import { useSession, useSignInOptions } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { authMessages } from "@/constants";
import { signInRedirect } from "@/utils/urls";
import AuthConfirmAccountPage from "./AuthConfirmAccountPage";

/**
 * AuthConfirmAccountPage's .query file: resending the email, open to anyone,
 * and confirming with the link in the URL, for its signed-in owner. Opening
 * the link confirms nothing; the button does. The API can't check a link
 * before then, so a dead one is found on pressing (docs/api-gaps.md).
 */
export default function AuthConfirmAccountPageQuery() {
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const { token } = useParams();
  const { status, allowSignup } = useSignInOptions();
  const session = useSession();
  const { resend, confirm } = useConfirmationSaves();
  // Set on pressing, so the reloaded session's `confirmed_at` doesn't redirect before the success message does.
  const [pressed, setPressed] = useState(false);
  const step = token === undefined ? "resend" : "confirm";

  if (token !== undefined) {
    // Wait for the session, and once signed in for the user, before deciding. A failure shows on the page.
    if (session.status.state === "loading") return <AsyncBoundary status={session.status} titleAs="h1" />;
    const signIn = signInRedirect(session.state, pathname + search + hash);
    if (signIn) return <Navigate to={signIn} replace />;
    // Already confirmed: Lightning sends you on with no message.
    if (session.session?.user.confirmedAt && !pressed) return <Navigate to="/projects" replace />;
  }

  return (
    // Keyed by step, so moving between the two URLs starts the form fresh.
    <AuthConfirmAccountPage
      key={step}
      step={step}
      status={step === "confirm" && session.status.state === "error" ? session.status : status}
      allowSignup={allowSignup}
      onResend={async ({ email }) => {
        await resend(email);
        // ponytail: the session as it was when pressed; pressing before it loads (the fake's 300 ms) goes to log in.
        // Signed out, /projects would bounce to log in, so go there; SessionGate toasts it otherwise.
        const to = session.state === "signed_in" ? "/projects" : "/users/log_in";
        void navigate(to, { replace: true, state: { flash: { tone: "info", message: authMessages.confirmSent } } });
      }}
      onConfirm={async () => {
        setPressed(true);
        try {
          await confirm(token!);
        } catch (error) {
          setPressed(false);
          if (isApiError(error, "not_found")) throw new Error(authMessages.confirmInvalid);
          throw error;
        }
        void navigate("/projects", { replace: true, state: { flash: { tone: "info", message: authMessages.confirmDone } } });
      }}
    />
  );
}

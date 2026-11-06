import { Navigate, useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { usePasswordResetSaves } from "@/api/passwordResets";
import { useSession, useSignInOptions } from "@/api/session";
import { authMessages } from "@/constants";
import { useFlash } from "@/routing/flash";
import type { Flash } from "@/types/auth";
import AuthResetPasswordPage from "./AuthResetPasswordPage";

/**
 * AuthResetPasswordPage's .query file: asking for a link, and setting a new
 * password with the one in the URL. Both go to log in with Lightning's
 * message. The API can't check a link before the form, so a dead one is found
 * on submit and goes back to asking for a new one (docs/api-gaps.md).
 */
export default function AuthResetPasswordPageQuery() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { status, allowSignup } = useSignInOptions();
  const { state } = useSession();
  const { request, reset } = usePasswordResetSaves();
  const flash = useFlash();
  const step = token === undefined ? "request" : "reset";

  // Signed in: Lightning sends you on from here.
  if (state === "signed_in") return <Navigate to="/projects" replace />;
  return (
    // Keyed by step, so a dead link's move to the request page starts it fresh.
    <AuthResetPasswordPage
      key={step}
      step={step}
      status={status}
      allowSignup={allowSignup}
      flash={flash}
      onRequest={async ({ email }) => {
        await request(email);
        const carried: Flash = { tone: "info", message: authMessages.resetSent };
        void navigate("/users/log_in", { state: { flash: carried } });
      }}
      onReset={async (values) => {
        try {
          await reset(token!, values);
        } catch (error) {
          if (!isApiError(error, "not_found")) throw error;
          const carried: Flash = { tone: "info", message: authMessages.resetInvalid };
          void navigate("/users/reset_password", { replace: true, state: { flash: carried } });
          return;
        }
        const carried: Flash = { tone: "info", message: authMessages.resetDone };
        void navigate("/users/log_in", { state: { flash: carried } });
      }}
    />
  );
}

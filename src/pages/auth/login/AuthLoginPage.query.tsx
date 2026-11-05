import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useSession, useSessionSaves, useSignInOptions } from "@/api/session";
import { authMessages } from "@/constants";
import { useFlash } from "@/routing/flash";
import { returnTo } from "@/utils/urls";
import AuthLoginPage from "./AuthLoginPage";

/**
 * AuthLoginPage's .query file: the instance's sign-in options, and signing in.
 * An account with MFA goes on to the two-factor page, keeping `return_to`.
 * A refusal shows in Lightning's words (`authMessages`) rather than the
 * server's, since Lightning's login has its own.
 */
export default function AuthLoginPageQuery() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { status, allowSignup, ssoProvider } = useSignInOptions();
  const { state } = useSession();
  const { signIn } = useSessionSaves();
  const flash = useFlash();

  // Already signed in: Lightning sends you on from the login page.
  if (state === "signed_in") return <Navigate to={returnTo(params)} replace />;
  return (
    <AuthLoginPage
      status={status}
      allowSignup={allowSignup}
      ssoProvider={ssoProvider}
      flash={flash}
      onLogIn={async (values) => {
        try {
          await signIn(values);
        } catch (error) {
          if (isApiError(error, "mfa_required")) {
            void navigate(`/users/two-factor?${new URLSearchParams({ return_to: returnTo(params) })}`);
            return;
          }
          // Lightning's flash for a refused sign-in; any other failure is the server's own message.
          if (isApiError(error, "invalid_credentials")) throw new Error(authMessages.invalidLogin);
          throw error;
        }
        void navigate(returnTo(params), { replace: true });
      }}
    />
  );
}

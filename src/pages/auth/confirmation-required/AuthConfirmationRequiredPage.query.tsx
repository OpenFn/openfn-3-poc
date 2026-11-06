import { Navigate, useLocation } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useConfirmationSaves } from "@/api/confirmations";
import { useSession } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { signInRedirect } from "@/utils/urls";
import AuthConfirmationRequiredPage from "./AuthConfirmationRequiredPage";

/** AuthConfirmationRequiredPage's .query file: only a locked-out session sees the page; any other goes where it belongs. */
export default function AuthConfirmationRequiredPageQuery() {
  const { pathname, search, hash } = useLocation();
  const { status, state } = useSession();
  const { resend } = useConfirmationSaves();

  if (state === undefined) return <AsyncBoundary status={status} titleAs="h1" />;
  const signIn = signInRedirect(state, pathname + search + hash);
  if (signIn) return <Navigate to={signIn} replace />;
  if (state !== "confirmation_required") return <Navigate to="/projects" replace />;

  return (
    <AuthConfirmationRequiredPage
      onResend={async () => {
        try {
          await resend();
          return { status: "sent" };
        } catch (error) {
          if (isApiError(error, "too_many_requests")) return { status: "throttled" };
          if (isApiError(error, "service_unavailable")) return { status: "failed" };
          throw error;
        }
      }}
    />
  );
}

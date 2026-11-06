import { Navigate, useLocation } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useConfirmationSaves } from "@/api/confirmations";
import { useSession } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { authMessages } from "@/constants";
import AuthConfirmationRequiredPage from "./AuthConfirmationRequiredPage";

/** AuthConfirmationRequiredPage's .query file: only a locked-out session sees the page; any other goes where it belongs. */
export default function AuthConfirmationRequiredPageQuery() {
  const { pathname } = useLocation();
  const { status, state } = useSession();
  const { resend } = useConfirmationSaves();

  if (state === undefined) return <AsyncBoundary status={status} />;
  const here = new URLSearchParams({ return_to: pathname });
  if (state === "signed_out") return <Navigate to={`/users/log_in?${here}`} replace />;
  if (state === "mfa_required") return <Navigate to={`/users/two-factor?${here}`} replace />;
  if (state !== "confirmation_required") return <Navigate to="/projects" replace />;

  return (
    <AuthConfirmationRequiredPage
      onResend={async () => {
        try {
          await resend();
          return { status: "sent" };
        } catch (error) {
          if (isApiError(error, "too_many_requests")) return { status: "throttled", message: authMessages.resendThrottled };
          if (isApiError(error, "service_unavailable")) return { status: "failed" };
          throw error;
        }
      }}
    />
  );
}

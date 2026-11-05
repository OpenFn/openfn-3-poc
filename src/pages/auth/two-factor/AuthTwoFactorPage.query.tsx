import { useNavigate, useSearchParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useSessionSaves } from "@/api/session";
import { authMessages } from "@/constants";
import type { TwoFactorMethod } from "@/types/auth";
import { returnTo } from "@/utils/urls";
import AuthTwoFactorPage from "./AuthTwoFactorPage";

/**
 * AuthTwoFactorPage's .query file: `?authentication_type=backup_code` asks
 * for a backup code, as in Lightning; the code finishes signing in, then
 * `return_to`. A wrong code shows in Lightning's words (`authMessages`).
 */
export default function AuthTwoFactorPageQuery() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { verify } = useSessionSaves();
  const method: TwoFactorMethod = params.get("authentication_type") === "backup_code" ? "backup_code" : "totp";
  const other = new URLSearchParams(params);
  other.set("authentication_type", method === "totp" ? "backup_code" : "totp");

  return (
    <AuthTwoFactorPage
      method={method}
      otherMethodHref={`/users/two-factor?${other}`}
      onVerify={async (code) => {
        try {
          await verify(method === "totp" ? { mfa_code: code } : { backup_code: code });
        } catch (error) {
          // Lightning's flash for a refused code; any other failure is the server's own message.
          if (isApiError(error, "invalid_credentials")) throw new Error(authMessages.invalidTwoFactorCode);
          throw error;
        }
        void navigate(returnTo(params), { replace: true });
      }}
    />
  );
}

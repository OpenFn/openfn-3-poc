import { useNavigate, useSearchParams } from "react-router-dom";
import { useSessionSaves } from "@/api/session";
import { useCurrentUser } from "@/session/session";
import { returnTo } from "@/utils/urls";
import AuthConfirmAccessPage from "./AuthConfirmAccessPage";

/**
 * AuthConfirmAccessPage's .query file: the password or an MFA code steps the
 * session up for five minutes, then back to `return_to`, or the profile page.
 * A wrong one rejects with the server's message, which the page shows.
 */
export default function AuthConfirmAccessPageQuery() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const user = useCurrentUser();
  const { stepUp } = useSessionSaves();
  return (
    <AuthConfirmAccessPage
      user={{ firstName: user.firstName, lastName: user.lastName, mfaEnabled: user.mfaEnabled }}
      onConfirm={async (values) => {
        await stepUp("password" in values ? { password: values.password } : { mfaCode: values.code });
        void navigate(returnTo(params, "/profile"));
      }}
    />
  );
}

/** The signed-in session on Lightning's API (api/account.md, Sessions). */
import { request } from "./client";

/** `GET` and `POST /api/session`'s `data`. */
export interface ApiSession {
  state: "signed_in" | "mfa_required" | "confirmation_required" | "signup_pending";
  user_id: string;
  /** When the step-up ends, or null when the session isn't stepped up. */
  stepped_up_until: string | null;
  csrf_token: string;
  pending_signup: { email: string; first_name: string; last_name: string } | null;
}

/**
 * Enter the password or an MFA code again: steps the session up for five
 * minutes, which a few routes need (`step_up_required`). A wrong one rejects
 * with 401 `invalid_credentials`.
 */
export const stepUp = (values: { password: string } | { mfaCode: string }) =>
  request<{ data: ApiSession }>("POST", "/api/session", "password" in values ? { password: values.password } : { mfa_code: values.mfaCode }).then(
    (answer) => answer.data
  );

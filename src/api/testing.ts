/** For stories and tests only: drive the fake server. The app never imports this, so no build carries it. */
import { resetFakeApi as resetServer } from "@/fake-api";
import { forgetCsrfToken } from "./client";

export { failNext, FAKE_PASSWORD, FAKE_MFA_CODE, FAKE_BACKUP_CODE, FAKE_RESET_TOKEN, FAKE_CONFIRM_TOKEN, setAllowSignup, setNeedsSetup } from "@/fake-api";

/** The fake server's starting data, signed in as the first fixture user, and a client that has forgotten the old session's CSRF token. */
export function resetFakeApi() {
  resetServer();
  forgetCsrfToken();
}

/**
 * Instance auth settings the fake server reads: the SSO provider for
 * GET /api/instance, and email verification for the lockout. Sign-up and
 * first setup are the fake's own switches (`setAllowSignup`, `setNeedsSetup`).
 * Static only: nothing here authenticates anyone.
 */
import type { SsoProvider } from "@/types/auth";
import type { AuthConfig } from "./models/auth";

export const authConfig: AuthConfig = {
  ssoProvider: null,
  requireEmailVerification: true,
};

/** A configured provider, for stories. */
export const exampleSsoProvider: SsoProvider = {
  name: "Keycloak",
  handlerUrl: "/authenticate/keycloak",
};

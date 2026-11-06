/** Instance auth settings, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { SsoProvider } from "@/types/auth";

export interface AuthConfig {
  /** An OIDC handler, if one is configured. Lightning supports one. */
  ssoProvider: SsoProvider | null;
  /** `:require_email_verification`: an account unconfirmed 48 hours after sign-up can only reach /users/confirm-required. */
  requireEmailVerification: boolean;
}

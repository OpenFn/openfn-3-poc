/** Instance auth settings, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { SsoProvider } from "../../types/auth";

export interface AuthConfig {
  /** `:allow_signup`. Off on demo.openfn.org, so /users/register shows the plain-text refusal. */
  allowSignup: boolean;
  /** An OIDC handler, if one is configured. Lightning supports one. */
  ssoProvider: SsoProvider | null;
  /** `:allow_first_setup`: true only on a fresh install with no superuser. */
  allowFirstSetup: boolean;
}

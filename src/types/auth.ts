/** Logged-out views: SSO providers and two-factor methods. Types only: no data, no behaviour. */

export interface SsoProvider {
  /** Admin-facing name of the OIDC provider (Settings > Authentication). */
  name: string;
  /** Lightning's `@auth_handler_url`: where "via external provider" goes. */
  handlerUrl: string;
}

/** Which method the two-factor page asks for (`?authentication_type=`). */
export type TwoFactorMethod = "totp" | "backup_code";

/** Sign-in views: SSO providers, two-factor methods and the message a redirect carries. Types only: no data, no behaviour. */

export interface SsoProvider {
  /** Admin-facing name of the OIDC provider (Settings > Authentication). */
  name: string;
  /** Lightning's `@auth_handler_url`: where "via external provider" goes. */
  handlerUrl: string;
}

/** Which method the two-factor page asks for (`?authentication_type=`). */
export type TwoFactorMethod = "totp" | "backup_code";

/** A message carried across a redirect to the page it lands on. */
export interface Flash {
  tone: "info" | "danger";
  message: string;
}

/** What the reset-password form holds. Only `password` is sent: the confirmation is the page's own check. */
export interface ResetPasswordValues {
  password: string;
  passwordConfirmation: string;
}

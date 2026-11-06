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

/** What the first-setup form holds, in the API's names. Only the first four are sent: the confirmation is the page's own check. */
export interface FirstSetupValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/** What the register form sends, in the API's names. */
export interface RegisterValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  terms_accepted: boolean;
}

/** What the reset-password form holds. Only `password` is sent: the confirmation is the page's own check. */
export interface ResetPasswordValues {
  password: string;
  passwordConfirmation: string;
}

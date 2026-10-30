/**
 * The profile page's contract (ProfilePageProps), written by hand: what the
 * host sends and what each form saves. Types only: no data, no behaviour.
 */

/** The signed-in user, as the profile page shows them. */
export interface ProfileDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  contactPreference: ContactPreference;
  insertedAt: string;
}

/** How often OpenFn may email the user ("Critical" or "Anytime"). */
export type ContactPreference = "critical" | "any";

/** What "Change basic information" saves. */
export interface BasicInfoValues {
  firstName: string;
  lastName: string;
  contactPreference: ContactPreference;
}

/** What a change of email address sends: the new address and the current password. */
export interface ChangeEmailValues {
  email: string;
  currentPassword: string;
}

/** What "Change password" sends. */
export interface ChangePasswordValues {
  password: string;
  passwordConfirmation: string;
  currentPassword: string;
}

export interface MfaSettings {
  /** The user has an authenticator app set up. */
  enabled: boolean;
  /** "Recovery codes" → View. */
  backupCodesHref: string;
}

/** The host's answer to starting MFA setup: a new secret, shown only while setting up. */
export interface MfaSetupResult {
  /** The secret as the user types it into an app (base32, no padding). */
  secret: string;
  /** An image of the otpauth QR code, as an image URL (a `data:image/svg+xml` URI from Lightning). */
  qrCodeSrc: string;
}

export interface GithubAccessSettings {
  /** GitHub's OAuth page for linking this account (opens in a new tab); null when GitHub isn't set up on this instance. */
  connectHref: string | null;
  /** "expired": linked once, but the token has lapsed, so the link says "Reconnect". */
  status: "connected" | "expired" | "none";
}

export interface AccountDeletionSettings {
  /** "Delete my account": the route that opens the deletion modal. */
  href: string;
  /** The user still has activity in projects: the modal adds a note. */
  hasActivityInProjects: boolean;
  /** Already scheduled for deletion and still has project activity: the modal only explains why it can't go ahead. Only true when `hasActivityInProjects` is. */
  blocked: boolean;
}

/** What the host sends the profile page (ProfilePageProps adds the deletion modal and the actions). */
export interface ProfilePageData {
  /**
   * The signed-in user. The basic information form starts from these values
   * when it mounts or `user.id` changes; new values for the same user don't
   * reset what's being typed.
   */
  user: ProfileDetail;
  mfa: MfaSettings;
  /**
   * Linking happens in another tab, so the host watches for it to finish, then
   * sends the new `status` and announces "GitHub account linked successfully",
   * or "Oops! GitHub account failed to link. Please try again" (Lightning's
   * `OauthTokenAdded` / `OauthTokenFailed` events).
   */
  github: GithubAccessSettings;
  /** The user's "experimental_features" preference. */
  experimentalFeatures: boolean;
  deletion: AccountDeletionSettings;
}

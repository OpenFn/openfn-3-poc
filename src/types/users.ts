/** A user's instance-wide role (Lightning.Accounts.User). Types only: no data, no behaviour. */

export type UserRole = "superuser" | "user";

/** A user (Lightning.Accounts.User), as the session and permissions.ts hold them. Not part of the page contract (STANDARDS §11). */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  /** ISO date the account was confirmed; null means unconfirmed. */
  confirmedAt: string | null;
  insertedAt: string;
  mfaEnabled: boolean;
  githubConnected: boolean;
  experimentalFeatures: boolean;
  /** Lightning's `support_user`: may access projects that allow support access. */
  supportUser: boolean;
  /** Superusers can disable an account; disabled users can't log in. */
  disabled: boolean;
  /** Pending deletion date, if the account is scheduled for deletion. */
  scheduledDeletion: string | null;
  contactPreference: "critical" | "any";
}

/** Instance details the layout shows (Lightning.Config). */
export interface InstanceInfo {
  /** Address the sidebar's "Support" link mails (`instance_admin_email`). */
  adminEmail: string;
  /** Release label in the sidebar footer's version chip. */
  releaseLabel: string;
}

/** Who is signed in, and where. Lightning's `@current_user` plus instance config. */
export interface Session {
  user: User;
  instance: InstanceInfo;
}

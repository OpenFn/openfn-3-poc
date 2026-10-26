/** Users (Lightning.Accounts.User), as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { UserRole } from "../../types/users";

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

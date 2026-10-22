/** Superuser admin views: audit trail and auth provider. Types only: no data, no behaviour. */
import type { Collection } from "./project-settings";
import type { Project } from "./projects";
import type { UserRole } from "./users";

/** A row of /settings/users, and the account the admin user form edits: what they show, nothing more. */
export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  supportUser: boolean;
  disabled: boolean;
  /** ISO timestamp of the pending deletion; null when none is scheduled. */
  scheduledDeletion: string | null;
}

/** The account whose deletion dialog is open (/settings/users/:id/delete). */
export interface AdminDeleteUser {
  id: string;
  /** Typed back to confirm. */
  email: string;
  /** Set when a deletion is already scheduled: confirming then deletes the account at once. */
  scheduledDeletion: string | null;
  /** The account has run activity in projects: deleting it now is refused. */
  hasActivityInProjects: boolean;
}

/** What the admin user form saves. On a new account the host ignores the edit-only fields. */
export interface UserFormValues {
  firstName: string;
  lastName: string;
  email: string;
  /** Empty on edit keeps the current password. */
  password: string;
  role: UserRole;
  supportUser: boolean;
  scheduledDeletion: string;
  disabled: boolean;
}

/** A recorded field value. Lightning stores JSON; the page prints it as text. */
export type AuditValue = string | number | boolean | null;

export interface AuditEvent {
  id: string;
  /** ISO timestamp. */
  insertedAt: string;
  event: string;
  /** Item type as stored, e.g. "workflow"; the table shows the last dotted segment. */
  itemType: string;
  itemId: string;
  actorId: string;
  actorLabel: string;
  /** Email for users; the service account id for service accounts; null shows the actor's short id instead. */
  actorIdentifier: string | null;
  changes: { before: Record<string, AuditValue> | null; after: Record<string, AuditValue> | null };
  /** Encrypted credential bodies per environment, shown under the changes. */
  credentialBodies?: Record<string, string>;
}

export interface AuthProvider {
  id: string | null;
  name: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  redirectHost: string;
  allowUnverifiedEmail: boolean;
}

/** A row of /settings/projects: the project with its owner and deletion date joined in. */
export interface AdminProjectRow extends Project {
  /** The owner's full name; "" when the project has no owner. */
  ownerName: string;
  scheduledDeletion: string | null;
}

/** A row of /settings/collections: the collection with its project's name. */
/** One row of the instance-wide collections table: what it shows, no preview. */
export interface AdminCollectionRow extends Omit<Collection, "previewJson"> {
  projectName: string;
}

/** What the create / edit collection form saves: the name as typed (the host derives the URL-safe name) and the project. */
export interface CollectionFormValues {
  rawName: string;
  projectId: string;
}

/** What Phoenix LiveDashboard's home page shows (a static approximation). */
export interface LiveDashboardData {
  systemInfo: string;
  versions: { elixir: string; phoenix: string; dashboard: string };
  uptime: string;
  totalInput: string;
  totalOutput: string;
  runQueues: { total: number; cpu: number; io: number };
  limits: { label: string; used: number; limit: number }[];
  memory: { label: string; value: number; color: string }[];
  tabs: string[];
}

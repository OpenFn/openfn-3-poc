/** Superuser admin views: users, projects, collections, audit trail and auth provider. Types only: no data, no behaviour. */
import type { ProjectInput, ProjectRole } from "./projects";
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
}

/** The configured OpenID Connect provider, as the admin form shows it: the secret itself never leaves the host. */
export interface AuthProvider {
  id: string | null;
  name: string;
  discoveryUrl: string;
  clientId: string;
  /** A secret is stored; the form may leave the field blank to keep it. */
  hasClientSecret: boolean;
  redirectHost: string;
  allowUnverifiedEmail: boolean;
}

/** What the auth provider form saves or tests. A blank secret keeps the stored one. */
export interface AuthProviderValues {
  name: string;
  discoveryUrl: string;
  clientId: string;
  clientSecret: string;
  redirectHost: string;
  allowUnverifiedEmail: boolean;
}

/** A row of /settings/projects: what the table shows, with the owner joined in. */
export interface AdminProjectRow {
  id: string;
  /** A sandbox's is "parent/sandbox". */
  name: string;
  /** The owner's full name; null when the project has no owner. */
  ownerName: string | null;
  membersCount: number;
  insertedAt: string;
  /** ISO timestamp of the pending deletion; null when none is scheduled. */
  scheduledDeletion: string | null;
}

/** The fields the projects list sorts by (`?sort=`), as the API names them. */
export type AdminProjectSortKey = "name" | "inserted_at";

/** Someone the admin project form can give a role to. */
export interface AdminProjectUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** The body of `PUT /api/projects/:id` with `members`; `name` is as typed until the form sends it URL-safe. */
export interface AdminProjectFormValues extends ProjectInput {
  members: { email: string; role: ProjectRole }[];
}

/** One row of the instance-wide collections table (/settings/collections): what it shows, no preview. */
export interface AdminCollectionRow {
  id: string;
  projectId: string;
  name: string;
  /** Sum of the byte size of every item (shown as "Size"). */
  byteSizeSum: number;
  projectName: string;
}

/** What the create / edit collection form saves, named as the API names them: the name (as typed until it's sent URL-safe) and the project it goes in. */
export interface CollectionFormValues {
  name: string;
  project_id: string;
}

/** The fields the collections list sorts by (`?sort=`), as the API names them. */
export type CollectionSortKey = "name" | "byte_size_sum";

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

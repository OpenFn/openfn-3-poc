/** Superuser admin views: users, projects, collections, audit trail and auth provider. Types only: no data, no behaviour. */
import type { ProjectInput, ProjectRole } from "./projects";
import type { ResourceStatus } from "./resource";
import type { UserRole } from "./users";

/** The account the admin user form edits: what it shows, nothing more. */
export interface AdminUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  supportUser: boolean;
  disabled: boolean;
}

/** The account the open user form edits, by id; where loading it stands; and whether it's the signed-in user's. */
export interface AdminUserEditing {
  id: string;
  status: ResourceStatus;
  /** Undefined until it has loaded. */
  user: AdminUserRow | undefined;
  ownAccount: boolean;
}

/** A row of /settings/users. */
export interface AdminUserListRow extends AdminUserRow {
  /** ISO timestamp of the pending deletion; null when none is scheduled. */
  scheduledDeletion: string | null;
  /** They have created runs (`hasCreatedRun`). */
  hasActivityInProjects: boolean;
  /** Whether their deletion can be scheduled. Superusers' can't. */
  canDelete: boolean;
}

/** The fields the users list sorts by (`?sort=`), as the API names them. */
export type AdminUserSortKey = "first_name" | "role" | "disabled";

/** What the admin user form saves, named as the API names them. */
export interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  /** Blank on edit keeps the current password. */
  password: string;
  role: UserRole;
  support_user: boolean;
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

/** The instance's OpenID Connect provider, as the API sends it: the client secret never comes back. */
export interface AuthProvider {
  name: string;
  discoveryUrl: string;
  clientId: string;
  /** Where the provider sends people back, to register with it. */
  redirectUri: string;
}

/** What the auth provider form saves, named as the API names them. A blank `client_secret` keeps the stored one. */
export interface AuthProviderValues {
  name: string;
  discovery_url: string;
  client_id: string;
  client_secret: string;
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

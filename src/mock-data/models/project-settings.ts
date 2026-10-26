/** Project settings: collections, webhook auth, exports, GitHub sync, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { ExportStatus, GithubRepoConnection, WebhookAuthType } from "../../types/project-settings";

export interface ProjectSettings {
  /** Project environment ("Credentials will be loaded with values from this environment."). */
  env: string;
  allowSupportAccess: boolean;
}

export interface Collection {
  id: string;
  projectId: string;
  name: string;
  /** Sum of the byte size of every item (shown as "Used storage"). */
  byteSizeSum: number;
  /** The first record, pretty-printed, for the preview modal. null = empty. */
  previewJson: string | null;
}

export interface WebhookAuthMethod {
  id: string;
  projectId: string;
  name: string;
  authType: WebhookAuthType;
  username?: string;
  /** Placeholder secrets: fixture values, never real credentials. */
  password?: string;
  apiKey?: string;
  /** Workflows whose webhook trigger uses this method. */
  triggers: { workflowId: string; workflowName: string; triggerId: string }[];
  /** Channels using this method for client auth. */
  channels: { id: string; name: string }[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  insertedAt: string;
  /** null until the export finishes. */
  path: string | null;
  createdByUserId: string;
  status: ExportStatus;
}

export interface VcsFixture {
  /** Whether GitHub sync is configured for this Lightning instance. */
  githubEnabled: boolean;
  /** The project's repo connection when it has one. */
  connection: GithubRepoConnection | null;
}

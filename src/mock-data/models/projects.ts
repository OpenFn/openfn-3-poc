/** Projects and their members (Lightning.Projects.Project, ProjectUser), as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { ProjectRole, RetentionPolicy } from "../../types/projects";

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  failureAlert: boolean;
  digest: "never" | "daily" | "weekly" | "monthly";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  /** Sandboxes point at their parent project. */
  parentId: string | null;
  /** Hex colour used for sandbox accents in the picker and banner. */
  color: string | null;
  concurrency: number | null;
  retentionPolicy: RetentionPolicy;
  historyRetentionPeriod: number | null;
  dataclipRetentionPeriod: number | null;
  requiresMfa: boolean;
  members: ProjectMember[];
  /** When the project was last touched (for the projects dashboard). */
  lastUpdatedAt: string;
  insertedAt: string;
}

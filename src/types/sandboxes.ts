/** The sandboxes page's shapes, written by hand from Lightning's sandbox_live/ and api/projects.md. Types only. */

/** A project in the workspace, as a card on the sandboxes page. */
export interface SandboxRow {
  id: string;
  name: string;
  description: string | null;
  /** The card's colour strip; null uses the brand colour. */
  color: string | null;
  /** The nearest project above it the viewer can open, or null at the top of what they can see. */
  parentId: string | null;
  /** That project's name, for "Made from …". */
  parentName: string | null;
  /** When it will be purged, or null while it's live. A scheduled card is struck through and offers Restore. */
  scheduledDeletion: string | null;
  /** The server's answers for the viewer; each false greys its menu item with Lightning's reason. All false at the top of the workspace. */
  canEdit: boolean;
  canDelete: boolean;
  canMerge: boolean;
  /** Restore. False on a live sandbox. */
  canCancelDeletion: boolean;
  /** Live listed sandboxes below it, which deleting or merging it takes too. */
  descendantCount: number;
  /** Whether the page's own project is this one or below it, so deleting it leaves the page. */
  holdsCurrent: boolean;
  /** The live projects in the workspace it could merge into: not itself, not its own sandboxes, its parent first. */
  mergeTargets: MergeTargetRef[];
}

/** What the create and edit form saves: `name` as typed until it's sent URL-safe, and a palette colour, or null when none is picked. */
export interface SandboxValues {
  name: string;
  color: string | null;
}

/** A project the sandbox can be merged into. */
export interface MergeTargetRef {
  id: string;
  name: string;
}

/** A workflow a merge would change, with Lightning's badges. */
export interface MergeWorkflowRow {
  /** The sandbox's workflow, or the target's for a deleted one. */
  id: string;
  name: string;
  /** Also changed in the target since the sandbox was made: merging loses that change. */
  isDiverged: boolean;
  /** Deleted in the sandbox; ticking it deletes it from the target. Starts unticked. */
  isDeleted: boolean;
}

/** A credential only the sandbox has, which the merge can bring into the target. */
export interface MergeCredentialRow {
  /** The sandbox's project credential id. */
  id: string;
  name: string;
}

/** What merging into one target would do. */
export interface MergePreviewResult {
  targetId: string;
  workflows: MergeWorkflowRow[];
  credentials: MergeCredentialRow[];
}

/** What "Merge into …" sends. The server checks every id against its own preview. */
export interface MergeValues {
  targetId: string;
  /** The ticked rows that aren't `isDeleted`: sandbox workflow ids. */
  workflowIds: string[];
  /** The ticked `isDeleted` rows: target workflow ids to delete from the target. */
  deletedWorkflowIds: string[];
  credentialIds: string[];
}

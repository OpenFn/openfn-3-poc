/** The sandboxes page's shapes. Types only: no data, no behaviour. */

// ---------------------------------------------------------------------------
// The sandboxes page's contract (SandboxesIndexPageProps), written by hand
// from Lightning's sandbox_live/. The shapes that cross the page boundary.

/** A project in the workspace tree, as a card on the sandboxes page. */
export interface SandboxRow {
  id: string;
  name: string;
  /** The card's colour strip; null uses the primary colour. Ignored for a root that isn't a sandbox (always indigo). */
  color: string | null;
  /** The environment badge ("staging"); null for none. A root that isn't a sandbox shows "main" instead. */
  env: string | null;
  /** When it will be purged, or null while it's live. A scheduled card is struck through and offers Restore. */
  scheduledDeletion: string | null;
  /** Where clicking a live card goes: the project's workflows. */
  workflowsHref: string;
  /** The route that opens the edit form (Lightning's is under the sandbox's parent). */
  editHref: string;
  /** Each false greys its button with Lightning's "not authorized" tooltip. All false once scheduled. */
  canEdit: boolean;
  canDelete: boolean;
  canMerge: boolean;
  /** Restore. False on a live sandbox. */
  canCancelDeletion: boolean;
  /** Why Restore is blocked (the plan's sandbox limit), or null. */
  restoreBlockedReason: string | null;
  /** Live sandboxes under this one, which deleting it takes with it. */
  activeDescendantCount: number;
}

/** The create or edit form, open when the route says so (/sandboxes/new, /sandboxes/:id/edit). */
export type SandboxForm =
  | {
      mode: "new";
      /** The project (or sandbox) the new sandbox goes under: "created under the X project". */
      parentName: string;
      parentIsSandbox: boolean;
      /** Lightning picks a random palette colour for a new sandbox. */
      initialColor: string;
    }
  | {
      mode: "edit";
      sandboxId: string;
      initial: SandboxValues;
    };

/** What the form saves: the name as typed (the host derives the URL-safe name) and a palette colour, or null when none is picked. */
export interface SandboxValues {
  rawName: string;
  color: string | null;
}

/** A project the sandbox can be merged into. */
export interface MergeTargetRef {
  id: string;
  name: string;
}

/** A workflow in the merge list, with Lightning's badges. */
export interface MergeWorkflowRow {
  id: string;
  name: string;
  /** Changed in the sandbox, or new. Changed ones start selected. */
  isChanged: boolean;
  /** Also changed in the target since the fork: merging loses that change. */
  isDiverged: boolean;
  /** Not in the target; merging creates it. */
  isNew: boolean;
  /** Deleted in the sandbox; selecting it deletes it from the target. Starts unselected. */
  isDeleted: boolean;
}

/** A credential only the sandbox has, which the merge can add to the target. */
export interface MergeCredentialRow {
  /** The sandbox's project credential id. */
  id: string;
  name: string;
}

/** The host's answer to "what would merging into this target do". */
export interface MergePreviewResult {
  /**
   * Projects in the workspace the viewer may merge into: live, not the sandbox, not under it, and where the
   * viewer is owner, admin or editor (index.ex `get_merge_target_options`). Merging into any other is refused.
   */
  targets: MergeTargetRef[];
  /** The target this preview is for (the sandbox's parent by default), or null when there's none to pick. */
  targetId: string | null;
  workflows: MergeWorkflowRow[];
  credentials: MergeCredentialRow[];
  /** Collections only the sandbox has, which the merge creates in the target. */
  collectionsToAdd: string[];
}

/** What "Merge" sends. The host re-checks every id. */
export interface MergeValues {
  targetId: string;
  /**
   * The selected workflows' ids as the preview gave them: a sandbox workflow's id, or for an `isDeleted` row
   * the target's workflow id. The host splits the list by the preview, as Lightning's
   * `resolve_selected_workflow_ids` does.
   */
  workflowIds: string[];
  credentialIds: string[];
  /** Previewed collections the user unticked. Any other sandbox-only collection is still created. */
  skippedCollectionNames: string[];
}

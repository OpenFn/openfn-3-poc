/** Project roles, retention policy and the project a page is in. Types only: no data, no behaviour. */

export type ProjectRole = "owner" | "admin" | "editor" | "viewer";

export type RetentionPolicy = "retain_all" | "retain_with_errors" | "erase_all";

/**
 * The project a page is in: enough to build its links and draw it in the
 * crumbs and the project picker. Part of the page contract hosts send,
 * written out rather than picked from the replica's `Project` model.
 */
export interface CurrentProject {
  id: string;
  /** Sandboxes point at their parent project. */
  parentId: string | null;
  /** Hex colour used for sandbox accents in the picker and banner. */
  color: string | null;
}

/** One page of a server-paginated list. */
export interface PageInfo {
  /** From 1 (`?page=`). */
  number: number;
  size: number;
  totalEntries: number;
}

/** One page of a list whose API sends links but no total (api/conventions.md): the last page comes from `links.last`. */
export interface PageLinks {
  /** From 1 (`?page=`). */
  number: number;
  size: number;
  totalPages: number;
}

/** How a server-sorted list is ordered; the page links each column to the URL that re-sorts it. */
export interface SortState<K extends string = string> {
  key: K;
  direction: "asc" | "desc";
}

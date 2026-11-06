/** Collections on Lightning's API (api/collections.md): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminCollectionRow, CollectionFormValues, CollectionSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { listAll, request, sortParam, statusOf } from "./client";

/** A collection as `GET /api/collections` lists it. */
export interface ApiCollection {
  id: string;
  project_id: string;
  name: string;
  byte_size_sum: number;
  project_name: string;
}

/** A row of the instance-wide collections table. */
export function adminCollectionRow(c: ApiCollection): AdminCollectionRow {
  return { id: c.id, projectId: c.project_id, name: c.name, byteSizeSum: c.byte_size_sum, projectName: c.project_name };
}

/** The `sort` fields the list takes, so a query can check what the URL asks for. */
const SORT_KEYS: Record<CollectionSortKey, true> = { name: true, byte_size_sum: true };
export const isCollectionSortKey = (key: string | undefined): key is CollectionSortKey => key !== undefined && Object.hasOwn(SORT_KEYS, key);

export const collectionKeys = { all: ["collections"] as const };

/**
 * Every collection on the instance, every page of it, in the order the server
 * sorts them (`-` for descending), and where loading them stands. Superusers only.
 */
export function useAllCollections(sort: SortState<CollectionSortKey>): { status: ResourceStatus; collections: AdminCollectionRow[] } {
  const param = sortParam(sort);
  const query = useQuery({
    queryKey: [...collectionKeys.all, param],
    queryFn: () => listAll<ApiCollection>(`/api/collections?sort=${param}`, "data"),
    select: (rows) => rows.map(adminCollectionRow),
    // Re-sorting keeps the old rows on screen until the new order arrives.
    placeholderData: keepPreviousData,
  });
  return { status: statusOf(query), collections: query.data ?? [] };
}

/**
 * Create, rename or move (planned): one `PUT` to the project's path. Each
 * resolves once the list has reloaded.
 */
export function useCollectionSaves() {
  const queryClient = useQueryClient();
  const put = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CollectionFormValues }) =>
      request("PUT", `/api/projects/${values.project_id}/collections/${id}`, { name: values.name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: collectionKeys.all }),
  });
  return {
    create: async (values: CollectionFormValues) => void (await put.mutateAsync({ id: crypto.randomUUID(), values })),
    update: async (id: string, values: CollectionFormValues) => void (await put.mutateAsync({ id, values })),
  };
}

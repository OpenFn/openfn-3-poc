import { combinedStatus } from "@/api/client";
import { isCollectionSortKey, useAllCollections, useCollectionSaves } from "@/api/collections";
import { useAllProjectOptions } from "@/api/projects";
import type { CollectionSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import { useUrlParams } from "@/utils/useUrlParams";
import AdminCollectionsPage from "./AdminCollectionsPage";

/**
 * AdminCollectionsPage's query: every collection on the instance from the
 * API, in the order `?sort` and `?dir` ask for (the server sorts), every
 * project on the instance (`scope=all`) for the form's picker, and the
 * saves. It only passes data and actions.
 */
export default function AdminCollectionsPageQuery() {
  const { params, update } = useUrlParams<"sort" | "dir">();
  const sort: SortState<CollectionSortKey> = {
    key: isCollectionSortKey(params.sort) ? params.sort : "name",
    direction: params.dir === "desc" ? "desc" : "asc",
  };
  const list = useAllCollections(sort);
  const projects = useAllProjectOptions();
  const saves = useCollectionSaves();
  return (
    <AdminCollectionsPage
      status={combinedStatus(list.status, projects.status)}
      collections={list.collections}
      sort={sort}
      onSort={(next) => update({ sort: next.key, dir: next.direction })}
      projectOptions={projects.options}
      onCreate={saves.create}
      onUpdate={saves.update}
    />
  );
}

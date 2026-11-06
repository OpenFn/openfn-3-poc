/** Dataclips on Lightning's API (api/dataclips.md): the API's shape, its mapper, its keys, and the hook a .query file calls. */
import { useQuery } from "@tanstack/react-query";
import type { DataclipBody, DataclipDetail, DataclipType } from "@/types/history";
import type { ResourceStatus } from "@/types/resource";
import { request, statusOf } from "./client";

/** A dataclip as `GET /api/dataclips/:id` sends it, with its body. */
export interface ApiDataclip {
  id: string;
  attributes: {
    name: string | null;
    type: DataclipType;
    project_id: string;
    wiped_at: string | null;
    inserted_at: string;
    updated_at: string;
    /** `{ data, request }` for http_request and kafka; null once wiped. */
    body: unknown;
  };
}

export interface LoadedDataclip {
  projectId: string;
  detail: DataclipDetail;
  body: DataclipBody | undefined;
}

/** A dataclip with its body pretty-printed as Lightning's viewer shows it (a null body reads `null`). */
export function dataclipOf({ id, attributes: a }: ApiDataclip): LoadedDataclip {
  return {
    projectId: a.project_id,
    detail: { id, name: a.name, type: a.type, insertedAt: a.inserted_at, updatedAt: a.updated_at, wipedAt: a.wiped_at },
    body: a.wiped_at === null ? { text: JSON.stringify(a.body, null, 2) } : undefined,
  };
}

const dataclipKeys = { one: (id: string) => ["dataclips", id] as const };

/** One dataclip with its body, in one request, and where loading it stands. From any project the person may open. */
export function useDataclip(id: string): { status: ResourceStatus; dataclip: LoadedDataclip | undefined } {
  const query = useQuery({
    queryKey: dataclipKeys.one(id),
    queryFn: () => request<{ data: ApiDataclip }>("GET", `/api/dataclips/${encodeURIComponent(id)}`).then((answer) => answer.data),
    select: dataclipOf,
  });
  return { status: statusOf(query), dataclip: query.data };
}

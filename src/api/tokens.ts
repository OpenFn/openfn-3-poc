/** Personal access tokens on Lightning's API (api/account.md): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResourceStatus } from "@/types/resource";
import type { ApiToken } from "@/types/tokens";
import { request, statusOf } from "./client";

/** A token as `GET /api/me/tokens` lists it. `token` is masked, except in the answer that creates it. */
export interface ApiTokenEntry {
  id: string;
  token: string;
  inserted_at: string;
  last_used_at: string | null;
}

/** A row of the tokens table. The server masks the token, so the row shows the mask as sent. */
export function tokenRow(t: ApiTokenEntry): ApiToken {
  return { id: t.id, masked: t.token, insertedAt: t.inserted_at, lastUsedAt: t.last_used_at };
}

export const tokenKeys = { all: ["tokens"] as const };

/** The signed-in person's tokens, newest first, and where loading them stands. */
export function useTokens(): { status: ResourceStatus; tokens: ApiToken[] } {
  const query = useQuery({
    queryKey: tokenKeys.all,
    queryFn: () => request<{ data: ApiTokenEntry[] }>("GET", "/api/me/tokens"),
    select: (answer) => answer.data.map(tokenRow),
  });
  return { status: statusOf(query), tokens: query.data ?? [] };
}

/**
 * Generate and delete. Each resolves once the list has reloaded and rejects
 * with the `ApiError`. `generate` resolves with the whole new token, which is
 * never sent again. Generating needs a stepped-up session: without one it
 * rejects with `step_up_required` (`stepUp` in session.ts).
 */
export function useTokenSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: tokenKeys.all });
  const generate = useMutation({
    mutationFn: () => request<{ data: ApiTokenEntry }>("POST", "/api/me/tokens").then((answer) => answer.data.token),
    onSuccess: reload,
  });
  const remove = useMutation({
    mutationFn: (id: string) => request<void>("DELETE", `/api/me/tokens/${encodeURIComponent(id)}`),
    onSuccess: reload,
  });
  return { generate: () => generate.mutateAsync(), remove: (id: string) => remove.mutateAsync(id) };
}

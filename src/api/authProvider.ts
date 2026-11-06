/** The instance's single sign-on provider on Lightning's API (api/authentication.md, Single sign-on provider): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthProvider, AuthProviderValues } from "@/types/admin";
import type { ResourceStatus } from "@/types/resource";
import { isApiError, request, statusOf } from "./client";

/** `GET /api/auth_provider`'s `data`. */
export interface ApiAuthProvider {
  name: string;
  discovery_url: string;
  client_id: string;
  redirect_uri: string;
  inserted_at: string;
  updated_at: string;
}

export const authProviderOf = (p: ApiAuthProvider): AuthProvider => ({
  name: p.name,
  discoveryUrl: p.discovery_url,
  clientId: p.client_id,
  redirectUri: p.redirect_uri,
});

export const authProviderKeys = { all: ["auth_provider"] as const };

/** The provider, null when none is set up, and where loading it stands. Superusers only. */
export function useAuthProvider(): { status: ResourceStatus; provider: AuthProvider | null } {
  const query = useQuery({
    queryKey: authProviderKeys.all,
    // None set up is a 404: an answer, not a failure.
    queryFn: () =>
      request<{ data: ApiAuthProvider }>("GET", "/api/auth_provider").then(
        (answer) => authProviderOf(answer.data),
        (error: unknown) => {
          if (isApiError(error, "not_found")) return null;
          throw error;
        }
      ),
  });
  return { status: statusOf(query), provider: query.data ?? null };
}

/** Set up or replace the provider, and remove it. Each resolves once the provider has reloaded, and rejects with the `ApiError`. */
export function useAuthProviderSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: authProviderKeys.all });
  const save = useMutation({
    mutationFn: ({ client_secret, ...values }: AuthProviderValues) =>
      request("PUT", "/api/auth_provider", client_secret.trim() ? { ...values, client_secret } : values),
    onSuccess: reload,
  });
  const remove = useMutation({ mutationFn: () => request<void>("DELETE", "/api/auth_provider"), onSuccess: reload });
  return {
    save: async (values: AuthProviderValues) => void (await save.mutateAsync(values)),
    remove: () => remove.mutateAsync(),
  };
}

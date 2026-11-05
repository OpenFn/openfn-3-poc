/** OAuth clients on Lightning's API (api/credentials.md, OAuth clients): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialProjectRef, OauthClientRow, OauthClientValues } from "@/types/credentials";
import type { ResourceStatus } from "@/types/resource";
import { listAll, renameFields, request, statusOf } from "./client";
import { credentialKeys } from "./credentials";

/** An OAuth client as `GET /api/oauth_clients` lists it. `client_secret` is never sent. */
export interface ApiOauthClient {
  id: string;
  name: string;
  client_id: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string | null;
  userinfo_endpoint: string | null;
  introspection_endpoint: string | null;
  scopes_doc_url: string | null;
  /** Comma-separated. */
  mandatory_scopes: string;
  optional_scopes: string;
  global: boolean;
  user_id: string;
  project_ids: string[];
}

const scopes = (list: string) => list.split(",").map((s) => s.trim()).filter(Boolean);

/**
 * A row of the OAuth clients table. The API sends project ids, so they're
 * named from `projects`; one the viewer can't see is left out. A global
 * client someone else owns can't be edited, and the API doesn't say who owns it.
 */
export function oauthClientRow(c: ApiOauthClient, viewer: { id: string; email: string }, projects: CredentialProjectRef[]): OauthClientRow {
  const mine = c.user_id === viewer.id;
  return {
    id: c.id,
    name: c.name,
    clientId: c.client_id,
    ownerEmail: mine ? viewer.email : "",
    global: c.global,
    projects: projects.filter((p) => c.project_ids.includes(p.id)),
    authorizationEndpoint: c.authorization_endpoint,
    tokenEndpoint: c.token_endpoint,
    revocationEndpoint: c.revocation_endpoint ?? "",
    introspectionEndpoint: c.introspection_endpoint ?? "",
    userinfoEndpoint: c.userinfo_endpoint ?? "",
    mandatoryScopes: scopes(c.mandatory_scopes),
    optionalScopes: scopes(c.optional_scopes),
    scopesDocUrl: c.scopes_doc_url ?? "",
    canEdit: mine,
  };
}

export const oauthClientKeys = { all: ["oauth_clients"] as const };

/** The signed-in person's own clients and the global ones, by name, and where loading them stands. */
export function useOauthClients(viewer: { id: string; email: string }, projects: CredentialProjectRef[]): { status: ResourceStatus; oauthClients: OauthClientRow[] } {
  const query = useQuery({
    queryKey: oauthClientKeys.all,
    queryFn: () => listAll<ApiOauthClient>("/api/oauth_clients", "oauth_clients"),
    select: (rows) => rows.map((c) => oauthClientRow(c, viewer, projects)),
  });
  return { status: statusOf(query), oauthClients: query.data ?? [] };
}

// The form's names for the API's fields, so a 422 lands on its field.
const FIELDS: Record<string, keyof OauthClientValues> = {
  name: "name",
  client_id: "clientId",
  client_secret: "clientSecret",
  authorization_endpoint: "authorizationEndpoint",
  token_endpoint: "tokenEndpoint",
  revocation_endpoint: "revocationEndpoint",
  introspection_endpoint: "introspectionEndpoint",
  userinfo_endpoint: "userinfoEndpoint",
  scopes_doc_url: "scopesDocUrl",
  project_ids: "projectIds",
};

/** The form's values as the API takes them. A blank secret is left out, which keeps the saved one. */
const toApi = (v: OauthClientValues) => ({
  name: v.name,
  client_id: v.clientId,
  ...(v.clientSecret && { client_secret: v.clientSecret }),
  authorization_endpoint: v.authorizationEndpoint,
  token_endpoint: v.tokenEndpoint,
  revocation_endpoint: v.revocationEndpoint || null,
  introspection_endpoint: v.introspectionEndpoint || null,
  userinfo_endpoint: v.userinfoEndpoint || null,
  scopes_doc_url: v.scopesDocUrl || null,
  mandatory_scopes: v.mandatoryScopes.join(","),
  optional_scopes: v.optionalScopes.join(","),
  global: v.global,
  project_ids: v.projectIds,
});

/**
 * Create, edit and delete. Each resolves once the lists have reloaded and
 * rejects with the `ApiError`, whose field errors are keyed by
 * `OauthClientValues`' names. Deleting reloads the credentials too, since
 * those that used the client lose it.
 */
export function useOauthClientSaves() {
  const queryClient = useQueryClient();
  const path = (id: string) => `/api/oauth_clients/${encodeURIComponent(id)}`;
  const save = useMutation({
    mutationFn: ({ id, values }: { id: string; values: OauthClientValues }) => request("PUT", path(id), toApi(values)).catch((error: unknown) => Promise.reject(renameFields(error, FIELDS))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: oauthClientKeys.all }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => request<void>("DELETE", path(id)),
    onSuccess: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: oauthClientKeys.all }), queryClient.invalidateQueries({ queryKey: credentialKeys.all })]),
  });
  return {
    create: async (values: OauthClientValues) => void (await save.mutateAsync({ id: crypto.randomUUID(), values })),
    update: async (id: string, values: OauthClientValues) => void (await save.mutateAsync({ id, values })),
    remove: async (id: string) => void (await remove.mutateAsync(id)),
  };
}

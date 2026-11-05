/** Credentials on Lightning's API (api/credentials.md): the API's shape, its mappers, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialRow, CredentialTypeOption, CredentialValues, SchemaField } from "@/types/credentials";
import type { ResourceStatus } from "@/types/resource";
import { ApiError, isApiError, listAll, renameFields, request, statusOf } from "./client";

/** A credential as `GET /api/credentials` sends it. The optional fields are api/credentials.md's planned scope. */
export interface ApiCredential {
  id: string;
  name: string;
  /** The adaptor's package name (`@openfn/language-dhis2`), `raw` or `oauth`. */
  schema: string;
  external_id: string | null;
  user_id: string;
  projects: { id: string; name: string; description: string | null }[];
  inserted_at: string;
  updated_at: string;
  scheduled_deletion?: string | null;
  transfer_status?: "pending" | "completed" | null;
  environments?: { name: string }[];
  owner?: { id: string; email: string | null };
  has_activity_in_projects?: boolean;
  oauth?: { oauth_client_id: string; name: string; scopes: string[] } | null;
}

/** A credential schema as `GET /api/credential_schemas` lists it. */
export interface ApiCredentialSchema {
  name: string;
  title: string;
}

/** One property of a schema's JSON Schema (`GET /api/credential_schemas/:name`). */
interface ApiSchemaProperty {
  title?: string;
  type?: string;
  format?: string;
  writeOnly?: boolean;
  examples?: unknown[];
}

const shortName = (schema: string) => schema.replace(/^@openfn\/language-/, "");

/**
 * One of the viewer's own credentials as a Credentials table row. Every
 * credential the list sends is the caller's, so the viewer may edit it.
 * Without the planned fields it has the answer for none: one `main`
 * environment, nothing pending, no runs. The API says nothing about which
 * workflows use it (docs/api-gaps.md).
 */
export function credentialRow(c: ApiCredential, viewerEmail: string): CredentialRow {
  return {
    id: c.id,
    name: c.name,
    schema: shortName(c.schema),
    // Only the client's name and id: an OAuth credential can't be edited here until sign-in is on the API.
    oauthClient: c.oauth ? { id: c.oauth.oauth_client_id, name: c.oauth.name, mandatoryScopes: [], optionalScopes: [], scopesDocUrl: "" } : null,
    ownerEmail: c.owner?.email ?? viewerEmail,
    projects: c.projects.map((p) => ({ id: p.id, name: p.name, workflowsUsing: [] })),
    externalId: c.external_id,
    environments: c.environments?.map((e) => e.name) ?? ["main"],
    transferStatus: c.transfer_status ?? null,
    scheduledDeletion: c.scheduled_deletion ?? null,
    hasActivityInProjects: c.has_activity_in_projects ?? false,
    canEdit: true,
  };
}

/** "Add a credential"'s adaptor types. Raw JSON is left out: the form offers it itself. */
export const credentialType = (s: ApiCredentialSchema): CredentialTypeOption => ({ key: shortName(s.name), name: s.title });

const KINDS: Record<string, SchemaField["kind"]> = { string: "text", integer: "integer", boolean: "boolean", object: "object" };
// Types Lightning reads as text without a warning (`Credentials.Schema`).
const TEXT_TYPES = ["string", "number", "array"];

/** A schema's fields, as Lightning's JsonSchemaBodyComponent draws them. */
export function schemaFields(schema: { properties?: Record<string, ApiSchemaProperty>; required?: string[] }): SchemaField[] {
  return Object.entries(schema.properties ?? {}).map(([key, p]) => {
    const type = p.type ?? "string";
    const kind = p.writeOnly ? "password" : p.format === "uri" ? "url" : (KINDS[type] ?? "text");
    return {
      key,
      label: p.title ?? key,
      kind,
      required: schema.required?.includes(key) ?? false,
      placeholder: typeof p.examples?.[0] === "string" ? p.examples[0] : null,
      unrecognizedType: KINDS[type] || TEXT_TYPES.includes(type) ? null : type,
    };
  });
}

export const credentialKeys = {
  all: ["credentials"] as const,
  schemas: ["credential_schemas"] as const,
  schema: (name: string) => ["credential_schemas", name] as const,
};

/** The signed-in person's own credentials, by name, and where loading them stands. */
export function useCredentials(viewerEmail: string): { status: ResourceStatus; credentials: CredentialRow[] } {
  const query = useQuery({
    queryKey: credentialKeys.all,
    queryFn: () => listAll<ApiCredential>("/api/credentials", "credentials"),
    select: (rows) => rows.map((c) => credentialRow(c, viewerEmail)),
  });
  return { status: statusOf(query), credentials: query.data ?? [] };
}

/** The adaptor types a credential can be, and a loader for one type's fields. */
export function useCredentialSchemas(): { credentialTypes: CredentialTypeOption[]; loadSchema: (key: string) => Promise<{ fields: SchemaField[] }> } {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: credentialKeys.schemas,
    queryFn: () => request<{ data: ApiCredentialSchema[] }>("GET", "/api/credential_schemas").then((answer) => answer.data),
    select: (rows) => rows.filter((s) => s.name !== "raw").map(credentialType),
  });
  const loadSchema = (key: string) =>
    queryClient
      .query({
        queryKey: credentialKeys.schema(key),
        queryFn: () =>
          request<{ data: { schema: Parameters<typeof schemaFields>[0] } }>("GET", `/api/credential_schemas/${encodeURIComponent(key)}`),
      })
      .then((answer) => ({ fields: schemaFields(answer.data.schema) }));
  return { credentialTypes: query.data ?? [], loadSchema };
}

// Saving the credential form.

const parseObject = (text: string): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

/**
 * What to send for one environment, or undefined to keep what's saved. The
 * form never sees saved secrets, so a blank field keeps its saved value and
 * an untouched body sends nothing. A raw body is sent whole.
 */
function bodyToSend(schema: string, text: string): Record<string, unknown> | undefined {
  const body = parseObject(text);
  const filled = schema === "raw" ? body : Object.fromEntries(Object.entries(body).filter(([, v]) => v !== ""));
  return Object.keys(filled).length ? filled : undefined;
}

const CREDENTIAL_FIELDS = { external_id: "externalId" };

/**
 * Writes the environments other than what POST or PUT already sent, then
 * deletes the stored ones the form left out. A refusal lands on its
 * environment (`environments.<name>`).
 */
async function writeEnvironments(id: string, values: CredentialValues, stored: string[]) {
  const path = (name: string) => `/api/credentials/${encodeURIComponent(id)}/environments/${encodeURIComponent(name)}`;
  const onEnvironment = (name: string) => (error: unknown) => {
    if (!isApiError(error)) throw error;
    throw new ApiError(error.status ?? 0, error.code, error.message, [{ code: error.code, detail: error.errors[0]?.detail ?? error.message, pointer: `#/environments/${name}` }]);
  };
  for (const e of values.environments) {
    if (e.name === "main") continue;
    const body = bodyToSend(values.schema, e.body);
    // A renamed environment's saved values can't be read back to move them.
    if (!body && e.previousName && e.previousName !== e.name) onEnvironment(e.name)(new ApiError(422, "invalid", "enter its values again to rename it"));
    if (body || !stored.includes(e.name)) await request("PUT", path(e.name), { body: body ?? {} }).catch(onEnvironment(e.name));
  }
  for (const name of stored) {
    if (!values.environments.some((e) => e.name === name)) await request("DELETE", path(name)).catch(onEnvironment(name));
  }
}

/**
 * Create and update a credential from today's credential form, and every
 * row action. Each resolves once the list has reloaded and rejects with the
 * `ApiError`, whose field errors are keyed as the form names its fields.
 */
export function useCredentialSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: credentialKeys.all });
  const path = (id: string, rest = "") => `/api/credentials/${encodeURIComponent(id)}${rest}`;
  const mainBody = (values: CredentialValues) => {
    const main = values.environments.find((e) => e.name === "main");
    const body = main && bodyToSend(values.schema, main.body);
    return body ? { credential_bodies: [{ name: "main", body }] } : {};
  };
  const fields = (values: CredentialValues) => ({ name: values.name, schema: values.schema, external_id: values.externalId || null });

  const create = useMutation({
    mutationFn: async (values: CredentialValues) => {
      const answer = await request<{ credential: ApiCredential }>("POST", "/api/credentials", {
        ...fields(values),
        credential_bodies: [{ name: "main", body: {} }],
        ...mainBody(values),
        project_credentials: values.projectIds.map((project_id) => ({ project_id })),
      }).catch((error: unknown) => Promise.reject(renameFields(error, CREDENTIAL_FIELDS)));
      await writeEnvironments(answer.credential.id, values, ["main"]);
    },
    onSettled: reload,
  });
  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CredentialValues }) => {
      const saved = queryClient.getQueryData<ApiCredential[]>(credentialKeys.all)?.find((c) => c.id === id);
      const linked = saved?.projects.map((p) => p.id) ?? [];
      await request("PUT", path(id), {
        ...fields(values),
        ...mainBody(values),
        // PUT only adds links; one taken away is unlinked on its own.
        project_credentials: values.projectIds.filter((p) => !linked.includes(p)).map((project_id) => ({ project_id })),
      }).catch((error: unknown) => Promise.reject(renameFields(error, CREDENTIAL_FIELDS)));
      for (const projectId of linked.filter((p) => !values.projectIds.includes(p))) {
        await request("DELETE", `/api/projects/${encodeURIComponent(projectId)}/credentials/${encodeURIComponent(id)}`);
      }
      await writeEnvironments(id, values, saved?.environments?.map((e) => e.name) ?? ["main"]);
    },
    onSettled: reload,
  });
  const remove = useMutation({
    mutationFn: ({ id, now }: { id: string; now: boolean }) =>
      now ? request<void>("DELETE", path(id)) : request("PUT", path(id, "/scheduled_deletion")),
    onSuccess: reload,
  });
  const cancelDeletion = useMutation({ mutationFn: (id: string) => request("DELETE", path(id, "/scheduled_deletion")), onSuccess: reload });
  const transfer = useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) =>
      request("PUT", path(id, "/transfer"), { recipient: email }).catch((error: unknown) => Promise.reject(renameFields(error, { recipient: "receiverEmail" }))),
    onSuccess: reload,
  });
  const revokeTransfer = useMutation({ mutationFn: (id: string) => request("DELETE", path(id, "/transfer")), onSuccess: reload });

  return {
    create: async (values: CredentialValues) => void (await create.mutateAsync(values)),
    update: async (id: string, values: CredentialValues) => void (await update.mutateAsync({ id, values })),
    remove: async (id: string, intent: { now: boolean }) => void (await remove.mutateAsync({ id, ...intent })),
    cancelDeletion: async (id: string) => void (await cancelDeletion.mutateAsync(id)),
    transfer: async (id: string, email: string) => void (await transfer.mutateAsync({ id, email })),
    revokeTransfer: async (id: string) => void (await revokeTransfer.mutateAsync(id)),
  };
}

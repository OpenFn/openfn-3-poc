/** Credentials on Lightning's API (api/credentials.md): the API's shape, its mappers, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialRow, CredentialTypeOption, CredentialValues, SchemaField } from "@/types/credentials";
import type { ResourceStatus } from "@/types/resource";
import { adaptorShortName } from "@/utils/adaptors";
import { ApiError, isApiError, listAll, request, statusOf } from "./client";

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
interface ApiCredentialSchema {
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

/**
 * One of the viewer's own credentials as a Credentials table row. Every
 * credential the list sends is the caller's, so the viewer may edit it.
 * Without the planned fields it has the answer for none: one `main`
 * environment, nothing pending, no runs. The API says nothing about which
 * workflows use it (docs/api-gaps.md).
 */
function credentialRow(c: ApiCredential, viewerEmail: string): CredentialRow {
  return {
    id: c.id,
    name: c.name,
    schema: adaptorShortName(c.schema),
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
    // Raw JSON is left out: the form offers it itself.
    select: (rows) => rows.filter((s) => s.name !== "raw").map((s) => ({ key: adaptorShortName(s.name), name: s.title })),
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

// Saving.

/**
 * A refusal with each pointer's field renamed (`#/external_id` → `#/externalId`),
 * so it lands on the shared form's field. The forms keep their own names
 * while project settings, which shares them, is still on its replica.
 */
export function renameFields(error: unknown, names: Record<string, string>): unknown {
  if (!isApiError(error)) return error;
  const errors = error.errors.map((e) => {
    const field = e.pointer?.replace(/^#\//, "").split("/")[0];
    return field && names[field] ? { ...e, pointer: e.pointer!.replace(`#/${field}`, `#/${names[field]}`) } : e;
  });
  return new ApiError(error.status ?? 0, error.code, error.message, errors);
}

/**
 * The `main` body to send, or undefined to keep what's saved. The form never
 * sees saved secrets, so it sends only the fields that were filled in; a
 * raw body is sent whole, unless it's empty.
 */
export function bodyToSend(schema: string, text: string): Record<string, unknown> | undefined {
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // The form checks a raw body is JSON before saving; an adaptor's body is built from its fields.
  }
  const filled = schema === "raw" ? body : Object.fromEntries(Object.entries(body).filter(([, v]) => v !== ""));
  return Object.keys(filled).length ? filled : undefined;
}

/** POST and PUT's body: `main` and the projects to link. Links are only ever added. */
function credentialBody(values: CredentialValues) {
  const main = values.environments.find((e) => e.name === "main");
  const body = main && bodyToSend(values.schema, main.body);
  return {
    name: values.name,
    schema: values.schema,
    ...(values.externalId && { external_id: values.externalId }),
    ...(body && { credential_bodies: [{ name: "main", body }] }),
    project_credentials: values.projectIds.map((project_id) => ({ project_id })),
  };
}

/**
 * Create and update from today's credential form, and every row action. Each
 * resolves once the list has reloaded and rejects with the `ApiError`, whose
 * field errors are keyed as the forms name their fields.
 */
export function useCredentialSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: credentialKeys.all });
  const path = (id: string, rest = "") => `/api/credentials/${encodeURIComponent(id)}${rest}`;
  const onFields = (error: unknown) => Promise.reject(renameFields(error, { external_id: "externalId" }));

  const create = useMutation({
    mutationFn: (values: CredentialValues) =>
      request("POST", "/api/credentials", { credential_bodies: [{ name: "main", body: {} }], ...credentialBody(values) }).catch(onFields),
    onSuccess: reload,
  });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CredentialValues }) => request("PUT", path(id), credentialBody(values)).catch(onFields),
    onSuccess: reload,
  });
  const remove = useMutation({
    mutationFn: ({ id, now }: { id: string; now: boolean }) =>
      now ? request<void>("DELETE", path(id)) : request("PUT", path(id, "/scheduled_deletion")),
    onSuccess: reload,
  });
  const cancelDeletion = useMutation({ mutationFn: (id: string) => request("DELETE", path(id, "/scheduled_deletion")), onSuccess: reload });
  const transfer = useMutation({
    mutationFn: ({ id, recipient }: { id: string; recipient: string }) => request("PUT", path(id, "/transfer"), { recipient }),
    onSuccess: reload,
  });
  const revokeTransfer = useMutation({ mutationFn: (id: string) => request("DELETE", path(id, "/transfer")), onSuccess: reload });

  return {
    create: async (values: CredentialValues) => void (await create.mutateAsync(values)),
    update: async (id: string, values: CredentialValues) => void (await update.mutateAsync({ id, values })),
    remove: async (id: string, intent: { now: boolean }) => void (await remove.mutateAsync({ id, ...intent })),
    cancelDeletion: async (id: string) => void (await cancelDeletion.mutateAsync(id)),
    transfer: async (id: string, recipient: string) => void (await transfer.mutateAsync({ id, recipient })),
    revokeTransfer: async (id: string) => void (await revokeTransfer.mutateAsync(id)),
  };
}

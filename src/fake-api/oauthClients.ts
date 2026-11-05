/** OAuth clients on the pretend server (api/credentials.md, OAuth clients). */
import { clientSecretsFor, credentialsFixture, oauthClients as clientFixtures } from "@/mock-data/credentials";
import { forbidden, invalid, json, noContent, now, paged, type Body, type Handler, type Problem } from "./answers";
import { isEditorIn } from "./projects";
import { currentUser } from "./session";

interface StoredClient {
  id: string;
  name: string;
  client_id: string;
  /** Never sent. */
  client_secret: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string | null;
  userinfo_endpoint: string | null;
  introspection_endpoint: string | null;
  scopes_doc_url: string | null;
  /** Comma-separated, as Lightning stores them. */
  mandatory_scopes: string;
  optional_scopes: string;
  global: boolean;
  user_id: string;
  project_ids: string[];
  inserted_at: string;
  updated_at: string;
}

const SEEDED_AT = "2026-01-01T00:00:00Z";
const seed = (): StoredClient[] =>
  clientFixtures.map((c) => ({
    id: c.id,
    name: c.name,
    ...(({ clientId, clientSecret }) => ({ client_id: clientId, client_secret: clientSecret }))(clientSecretsFor(credentialsFixture(), c.id)),
    authorization_endpoint: c.authorizationEndpoint,
    token_endpoint: c.tokenEndpoint,
    revocation_endpoint: c.revocationEndpoint || null,
    userinfo_endpoint: c.userinfoEndpoint || null,
    introspection_endpoint: c.introspectionEndpoint || null,
    scopes_doc_url: c.scopesDocUrl || null,
    mandatory_scopes: c.mandatoryScopes.join(","),
    optional_scopes: c.optionalScopes.join(","),
    global: c.global,
    user_id: c.ownerId,
    project_ids: [...c.projectIds],
    inserted_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  }));
let clients = seed();

/** For stories and tests: the starting clients. */
export const resetOauthClients = () => {
  clients = seed();
};

/** The clients as the fake holds them now, for the credentials' `oauth`. */
export const fakeOauthClients = () => clients;

// JSON leaves out an undefined field.
const clientJson = (c: StoredClient) => ({ ...c, client_secret: undefined });

const ENDPOINTS = ["authorization_endpoint", "token_endpoint", "revocation_endpoint", "userinfo_endpoint", "introspection_endpoint", "scopes_doc_url"];
const TEXT = ["name", "client_id", "client_secret", "mandatory_scopes", "optional_scopes", ...ENDPOINTS];
const isUrl = (value: string) => URL.canParse(value) && /^https?:/.test(value);

function check(body: Body, creating: boolean): NonNullable<Problem["errors"]> {
  const errors: NonNullable<Problem["errors"]> = Object.keys(body)
    .filter((key) => ![...TEXT, "global", "project_ids", "id"].includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
  // Leaving client_secret out of a replace keeps it.
  const required = ["name", "client_id", "authorization_endpoint", "token_endpoint", ...(creating ? ["client_secret"] : [])];
  for (const key of required) {
    if (typeof body[key] !== "string" || body[key] === "") errors.push({ code: "required", detail: "can't be blank", pointer: `#/${key}` });
  }
  for (const key of ENDPOINTS) {
    const value = body[key];
    if (typeof value === "string" && value !== "" && !isUrl(value)) errors.push({ code: "format", detail: "must be a valid URL", pointer: `#/${key}` });
  }
  ((body["project_ids"] ?? []) as string[]).forEach((projectId, i) => {
    if (!isEditorIn(projectId)) {
      errors.push({ code: "no_access", detail: "you can't share a client with this project", pointer: `#/project_ids/${i}` });
    }
  });
  return errors;
}

export const oauthClientRoutes: Record<string, Handler> = {
  // Your own and the global ones, by name.
  "GET /api/oauth_clients": (_params, _body, query) => {
    const rows = clients
      .filter((c) => c.global || c.user_id === currentUser().id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(clientJson);
    return json(200, paged("/api/oauth_clients", rows, query, "oauth_clients"));
  },
  "PUT /api/oauth_clients/:id": ({ id }, body) => {
    const existing = clients.find((c) => c.id === id);
    if (existing && existing.user_id !== currentUser().id) return forbidden();
    const errors = check(body, !existing);
    if (errors.length) return invalid(errors);
    // As Lightning, `global` is dropped, not refused, for anyone but a superuser.
    const global = currentUser().role === "superuser" ? body["global"] === true : (existing?.global ?? false);
    const text = Object.fromEntries(TEXT.filter((key) => typeof body[key] === "string").map((key) => [key, body[key] as string]));
    const fields = {
      ...text,
      ...Object.fromEntries(ENDPOINTS.map((key) => [key, (body[key] as string | undefined) || null])),
      global,
      project_ids: global ? [] : ((body["project_ids"] ?? []) as string[]),
      updated_at: now(),
    };
    if (existing) {
      Object.assign(existing, fields);
      return json(200, { oauth_client: clientJson(existing) });
    }
    const created = { mandatory_scopes: "", optional_scopes: "", ...fields, id: id!, user_id: currentUser().id, inserted_at: now() } as StoredClient;
    clients = [...clients, created];
    return json(201, { oauth_client: clientJson(created) });
  },
  // Credentials that used it stay; their `oauth` goes null with it.
  "DELETE /api/oauth_clients/:id": ({ id }) => {
    const found = clients.find((c) => c.id === id && c.user_id === currentUser().id);
    if (!found) return forbidden();
    clients = clients.filter((c) => c !== found);
    return noContent();
  },
};

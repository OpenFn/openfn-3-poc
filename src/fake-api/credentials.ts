/** Credentials and credential schemas on the pretend server (api/credentials.md). */
import {
  credentials as credentialFixtures,
  credentialsFixture,
  storedEnvironmentsFor,
  withActivity,
} from "@/mock-data/credentials";
import { purgeDeletedAfterDays } from "@/mock-data/project-settings";
import { forbidden, invalid, isUuid, json, noContent, now, paged, problem, type Body, type Handler, type Problem } from "./answers";
import { credentialSchemaRoutes, fullName } from "./credentialSchemas";
import { fakeOauthClients, oauthClientRoutes, resetOauthClients } from "./oauthClients";
import { fakeProjects } from "./projects";
import { currentUser, people } from "./session";

type Errors = NonNullable<Problem["errors"]>;

interface StoredCredential {
  id: string;
  name: string;
  /** The adaptor's package name, `raw` or `oauth`, as Lightning stores it. */
  schema: string;
  external_id: string | null;
  user_id: string;
  project_ids: string[];
  /** Bodies by environment name. Never sent. */
  bodies: Record<string, Body>;
  oauth_client_id: string | null;
  scheduled_deletion: string | null;
  transfer_status: "pending" | "completed" | null;
  has_activity_in_projects: boolean;
  inserted_at: string;
  updated_at: string;
}

const SEEDED_AT = "2026-01-01T00:00:00Z";
const seed = (): StoredCredential[] => {
  const fixture = credentialsFixture();
  return credentialFixtures.map((c) => ({
    id: c.id,
    name: c.name,
    schema: fullName(c.schema),
    external_id: c.externalId,
    user_id: c.ownerId,
    project_ids: [...c.projectIds],
    bodies: Object.fromEntries(storedEnvironmentsFor(fixture, c).map((e) => [e.name, JSON.parse(e.body || "{}") as Body])),
    oauth_client_id: c.oauthClientId ?? null,
    scheduled_deletion: c.scheduledDeletion,
    transfer_status: c.transferStatus,
    has_activity_in_projects: withActivity.has(c.id),
    inserted_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  }));
};
let credentials = seed();

/** For stories and tests: the starting credentials and OAuth clients. */
export const resetCredentials = () => {
  credentials = seed();
  resetOauthClients();
};

const roleIn = (projectId: string, userId: string) => fakeProjects().find((p) => p.id === projectId)?.members.find((m) => m.userId === userId)?.role;
const isEditorIn = (projectId: string) => ["owner", "admin", "editor"].includes(roleIn(projectId, currentUser().id) ?? "");

// The planned fields (api/credentials.md, "Planned additional scope") are sent too.
const credentialJson = (c: StoredCredential) => {
  const client = fakeOauthClients().find((o) => o.id === c.oauth_client_id);
  return {
    id: c.id,
    name: c.name,
    schema: c.schema,
    external_id: c.external_id,
    user_id: c.user_id,
    project_credentials: c.project_ids.map((project_id) => ({ id: `${c.id}:${project_id}`, project_id, credential_id: c.id, inserted_at: c.inserted_at, updated_at: c.updated_at })),
    // Links to projects you can't see are left out.
    projects: fakeProjects()
      .filter((p) => c.project_ids.includes(p.id) && roleIn(p.id, currentUser().id))
      .map((p) => ({ id: p.id, name: p.name, description: p.description || null })),
    inserted_at: c.inserted_at,
    updated_at: c.updated_at,
    scheduled_deletion: c.scheduled_deletion,
    transfer_status: c.transfer_status,
    environments: Object.keys(c.bodies).map((name) => ({ name })),
    owner: { id: c.user_id, email: people.find((u) => u.id === c.user_id)?.email ?? null },
    has_activity_in_projects: c.has_activity_in_projects,
    ...(c.schema === "oauth" && {
      oauth: client
        ? { oauth_client_id: client.id, name: client.name, scopes: client.mandatory_scopes.split(","), expires_at: null, reauthorization_required: false }
        : null,
    }),
  };
};
const answer = (status: number, c: StoredCredential) => json(status, { credential: credentialJson(c) });

/**
 * A body sent for an adaptor's schema replaces only the fields it holds, so a
 * form that never sees saved secrets can leave them blank: not in api/ yet
 * (docs/api-gaps.md). A raw body is replaced whole.
 */
const withBody = (c: StoredCredential, name: string, body: Body) => {
  c.bodies[name] = c.schema === "raw" ? body : { ...c.bodies[name], ...body };
};

// The fields POST and PUT take. external_id isn't in api/ yet (docs/api-gaps.md).
const KEYS = ["name", "schema", "owner", "credential_bodies", "project_credentials", "id", "external_id"];

/** The problems with a create or replace body, as one list (api/errors.md). */
function check(body: Body, existing: StoredCredential | undefined): Errors {
  const errors: Errors = Object.keys(body)
    .filter((key) => !KEYS.includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
  const name = body["name"];
  if (typeof name !== "string" || name.trim() === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/name" });
  else if (credentials.some((c) => c.user_id === currentUser().id && c.id !== existing?.id && c.name === name)) {
    errors.push({ code: "taken", detail: "has already been taken", pointer: "#/name" });
  }
  if (!existing && typeof body["schema"] !== "string") errors.push({ code: "required", detail: "can't be blank", pointer: "#/schema" });
  const bodies = body["credential_bodies"];
  if (bodies !== undefined && (!Array.isArray(bodies) || bodies.length !== 1 || (bodies[0] as Body)?.["name"] !== "main")) {
    errors.push({ code: "one_body", detail: "must be exactly one body, named main", pointer: "#/credential_bodies" });
  }
  ((body["project_credentials"] ?? []) as { project_id: string }[]).forEach(({ project_id }, i) => {
    if (!isEditorIn(project_id)) errors.push({ code: "no_access", detail: "you can't share credentials with this project", pointer: `#/project_credentials/${i}/project_id` });
  });
  return errors;
}

/** Applies a checked create or replace body. Links are only ever added. */
function apply(c: StoredCredential, body: Body) {
  c.name = body["name"] as string;
  if (typeof body["schema"] === "string") c.schema = fullName(body["schema"]);
  if ("external_id" in body) c.external_id = (body["external_id"] as string | null) || null;
  const main = (body["credential_bodies"] as { body: Body }[] | undefined)?.[0];
  if (main) withBody(c, "main", main.body);
  const links = ((body["project_credentials"] ?? []) as { project_id: string }[]).map((l) => l.project_id);
  c.project_ids = [...new Set([...c.project_ids, ...links])];
  c.updated_at = now();
}

/** The caller's own credential, or the refusal: 403 whether or not it exists; 409 while scheduled, unless `whileScheduled`. */
function own(id: string, whileScheduled = false): StoredCredential | Response {
  const c = credentials.find((x) => x.id === id && x.user_id === currentUser().id);
  if (!c) return forbidden();
  if (c.scheduled_deletion && !whileScheduled) return problem({ status: 409, code: "scheduled_for_deletion", detail: "This credential is scheduled for deletion." });
  return c;
}

function create(id: string, body: Body) {
  const errors = check(body, undefined);
  if (errors.length) return invalid(errors);
  const at = now();
  const created: StoredCredential = {
    id,
    name: "",
    schema: "raw",
    external_id: null,
    user_id: currentUser().id,
    project_ids: [],
    bodies: { main: {} },
    oauth_client_id: null,
    scheduled_deletion: null,
    transfer_status: null,
    has_activity_in_projects: false,
    inserted_at: at,
    updated_at: at,
  };
  apply(created, body);
  credentials = [...credentials, created];
  return answer(201, created);
}

const ENVIRONMENT = /^[a-z0-9][a-z0-9_-]{0,31}$/;

/** Credentials, their schemas and OAuth clients (api/credentials.md). */
export const credentialRoutes: Record<string, Handler> = {
  ...credentialSchemaRoutes,
  ...oauthClientRoutes,
  // Your own, by name.
  "GET /api/credentials": (_params, _body, query) => {
    const rows = credentials
      .filter((c) => c.user_id === currentUser().id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(credentialJson);
    return json(200, paged("/api/credentials", rows, query, "credentials"));
  },
  "POST /api/credentials": (_params, body) => create(crypto.randomUUID(), body),
  "PUT /api/credentials/:id": ({ id }, body) => {
    if (!credentials.some((c) => c.id === id)) {
      // Anyone may create one, so a bad id is a 400 to anyone.
      if (!isUuid(id!)) return problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: "is not a UUID", path: "id" }] });
      return create(id!, body);
    }
    const found = own(id!);
    if (found instanceof Response) return found;
    const errors = check(body, found);
    if (errors.length) return invalid(errors);
    apply(found, body);
    return answer(200, found);
  },
  // Also "Delete now" for a scheduled one. Refused once runs have used it.
  "DELETE /api/credentials/:id": ({ id }) => {
    const found = own(id!, true);
    if (found instanceof Response) return found;
    if (found.has_activity_in_projects) {
      return problem({ status: 409, code: "in_use", detail: "Cannot delete a credential that has activities in projects" });
    }
    credentials = credentials.filter((c) => c !== found);
    return noContent();
  },
  // Unlinks it from every project at once. Lightning moves the date if it's scheduled again; the API changes nothing.
  "PUT /api/credentials/:id/scheduled_deletion": ({ id }) => {
    const found = own(id!, true);
    if (found instanceof Response) return found;
    found.scheduled_deletion ??= new Date(Date.now() + purgeDeletedAfterDays * 86_400_000).toISOString().replace(/\.\d+Z$/, "Z");
    found.project_ids = [];
    return answer(200, found);
  },
  // The project links removed when it was scheduled stay removed.
  "DELETE /api/credentials/:id/scheduled_deletion": ({ id }) => {
    const found = own(id!, true);
    if (found instanceof Response) return found;
    if (!found.scheduled_deletion) return problem({ status: 404, code: "not_found", detail: "This credential isn't scheduled for deletion." });
    found.scheduled_deletion = null;
    return answer(200, found);
  },
  // Pending until the owner follows the emailed link, which the fake never sends.
  "PUT /api/credentials/:id/transfer": ({ id }, body) => {
    const found = own(id!);
    if (found instanceof Response) return found;
    const email = typeof body["recipient"] === "string" ? body["recipient"].toLowerCase() : "";
    const recipient = people.find((u) => u.email.toLowerCase() === email);
    if (!recipient) return invalid([{ code: "not_found", detail: "User does not exist", pointer: "#/recipient" }]);
    const missing = fakeProjects().filter((p) => found.project_ids.includes(p.id) && !roleIn(p.id, recipient.id));
    if (missing.length) {
      return invalid([{ code: "no_access", detail: `User doesn't have access to these projects: ${missing.map((p) => p.name).join(", ")}`, pointer: "#/recipient" }]);
    }
    found.transfer_status = "pending";
    return answer(200, found);
  },
  "DELETE /api/credentials/:id/transfer": ({ id }) => {
    const found = own(id!);
    if (found instanceof Response) return found;
    if (found.transfer_status !== "pending") return problem({ status: 404, code: "not_found", detail: "No transfer is pending." });
    found.transfer_status = null;
    return answer(200, found);
  },
  // Private and planned, like the rest of the environment routes.
  "PUT /api/credentials/:id/environments/:name": ({ id, name }, body) => {
    const found = own(id!);
    if (found instanceof Response) return found;
    const exists = name! in found.bodies;
    if (!ENVIRONMENT.test(name!)) return invalid([{ code: "format", detail: "has invalid format", path: "name" }]);
    if (!exists && Object.keys(found.bodies).length >= 5) return invalid([{ code: "exceeds_limit", detail: "a credential has at most 5 environments", path: "name" }]);
    withBody(found, name!, (body["body"] ?? {}) as Body);
    return json(exists ? 200 : 201, { data: { name, inserted_at: found.inserted_at, updated_at: now() } });
  },
  "DELETE /api/credentials/:id/environments/:name": ({ id, name }) => {
    const found = own(id!);
    if (found instanceof Response) return found;
    if (Object.keys(found.bodies).length === 1 && name! in found.bodies) {
      return invalid([{ code: "required", detail: "a credential needs at least one environment", path: "name" }]);
    }
    delete found.bodies[name!];
    return noContent();
  },
  // Only the owner here: a project owner or admin unlinking someone else's is in api/ but no page asks for it yet.
  "DELETE /api/projects/:project_id/credentials/:id": ({ project_id, id }) => {
    const found = own(id!);
    if (found instanceof Response) return found;
    if (!found.project_ids.includes(project_id!)) return problem({ status: 404, code: "not_found", detail: "This credential isn't shared with that project." });
    found.project_ids = found.project_ids.filter((p) => p !== project_id);
    return noContent();
  },
};

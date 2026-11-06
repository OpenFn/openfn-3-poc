/** Credentials on the pretend server (api/credentials.md). */
import {
  credentials as credentialFixtures,
  credentialsFixture,
  storedEnvironmentsFor,
  withActivity,
} from "@/mock-data/credentials";
import { purgeDeletedAfterDays } from "@/mock-data/project-settings";
import { SEEDED_AT, forbidden, invalid, isUuid, json, noContent, now, paged, problem, type Body, type Handler, type Problem } from "./answers";
import { credentialSchemaRoutes, schemaPackage } from "./credentialSchemas";
import { fakeOauthClients, oauthClientRoutes, resetOauthClients } from "./oauthClients";
import { fakeProjects, isEditorIn, isMemberOf } from "./projects";
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

const seed = (): StoredCredential[] => {
  const fixture = credentialsFixture();
  return credentialFixtures.map((c) => ({
    id: c.id,
    name: c.name,
    schema: schemaPackage(c.schema),
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

// The planned fields (api/credentials.md, "Planned additional scope") are sent too.
const credentialJson = (c: StoredCredential) => {
  const client = fakeOauthClients().find((o) => o.id === c.oauth_client_id);
  // Links to projects you can't see are left out.
  const visible = c.project_ids.filter((id) => isMemberOf(id, currentUser().id));
  return {
    id: c.id,
    name: c.name,
    schema: c.schema,
    external_id: c.external_id,
    user_id: c.user_id,
    project_credentials: visible.map((project_id) => ({ id: `${c.id}:${project_id}`, project_id, credential_id: c.id, inserted_at: c.inserted_at, updated_at: c.updated_at })),
    projects: fakeProjects()
      .filter((p) => visible.includes(p.id))
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
const withMainBody = (c: StoredCredential, body: Body) => {
  c.bodies["main"] = c.schema === "raw" ? body : { ...c.bodies["main"], ...body };
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
  // A link it already has stays, so only a new one is checked.
  ((body["project_credentials"] ?? []) as { project_id: string }[]).forEach(({ project_id }, i) => {
    if (!existing?.project_ids.includes(project_id) && !isEditorIn(project_id)) errors.push({ code: "no_access", detail: "you can't share credentials with this project", pointer: `#/project_credentials/${i}/project_id` });
  });
  return errors;
}

/** Applies a checked create or replace body. Links are only ever added. */
function apply(c: StoredCredential, body: Body) {
  c.name = body["name"] as string;
  if (typeof body["schema"] === "string") c.schema = schemaPackage(body["schema"]);
  if ("external_id" in body) c.external_id = (body["external_id"] as string | null) || null;
  const main = (body["credential_bodies"] as { body: Body }[] | undefined)?.[0];
  if (main) withMainBody(c, main.body);
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
  // POST takes no owner or id: those are PUT's.
  "POST /api/credentials": (_params, body) => {
    const extra = ["owner", "id"].filter((key) => key in body);
    if (extra.length) return invalid(extra.map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` })));
    return create(crypto.randomUUID(), body);
  },
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
    found.scheduled_deletion ??= now(new Date(Date.now() + purgeDeletedAfterDays * 86_400_000));
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
    // Lightning refuses it (`validate_credential_transfer/3`); api/ names no code for it.
    if (recipient?.id === currentUser().id) return invalid([{ code: "invalid", detail: "You cannot transfer a credential to yourself", pointer: "#/recipient" }]);
    // One answer whether or not the email has an account, so the form doesn't tell who has one:
    // a planned change to api/'s `not_found` and `no_access` (docs/api-gaps.md).
    if (!recipient || found.project_ids.some((id) => !isMemberOf(id, recipient.id))) {
      return invalid([{ code: "no_access", detail: "They need an account and a role in every project this credential is shared with", pointer: "#/recipient" }]);
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
};

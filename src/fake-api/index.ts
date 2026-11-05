/**
 * A pretend Lightning server, so the app runs with no backend. `fakeFetch`
 * takes the same arguments as `fetch` and answers as api/ says Lightning
 * would: status codes, JSON bodies, and problem documents for refusals
 * (api/errors.md), after a short wait. The fixtures in src/mock-data/ are its
 * database. Only src/api/client.ts imports this folder; going real deletes it.
 */
import { findUser, session } from "@/mock-data/users";
import { apiTokens } from "@/mock-data/tokens";
import credentials from "./recorded/credentials.json";
import { projects as projectFixtures } from "@/mock-data/projects";
import { workflowsIn } from "@/mock-data/workflows";
import { workOrdersIn } from "@/mock-data/history";
import { workflowStatsFor } from "@/mock-data/dashboard-stats";
import { compareBy, type SortValue } from "@/utils/useTableSort";
import { permissionsFor, type Permissions } from "@/permissions";
import type { Project } from "@/types/projects";
import { FAILURE_STATES } from "@/types/workflow-health";

/**
 * The fake user's password and MFA code, for signing in and stepping up. The
 * fake user is the session fixture's (demo@openfn.org). Not real secrets.
 */
export const FAKE_PASSWORD = "fake-password-not-real";
export const FAKE_MFA_CODE = "123456";

const WAIT_MS = 300;
/** How long a step-up lasts (api/authentication.md, session tokens). */
const STEP_UP_MS = 5 * 60_000;

export interface Problem {
  status: number;
  code: string;
  detail?: string;
  errors?: { code: string; detail: string; pointer?: string; parameter?: string; path?: string }[];
}

type Body = Record<string, unknown>;
type Handler = (params: Record<string, string>, body: Body, query: URLSearchParams) => Response;
type StoredToken = { id: string; token: string; inserted_at: string; last_used_at: string | null };

// The database, and the session's step-up.

const seed = (): StoredToken[] =>
  apiTokens.map((t) => ({ id: t.id, token: t.masked, inserted_at: t.insertedAt, last_used_at: t.lastUsedAt }));

let tokens = seed();
// The fake's own copy, like tokens: a project made here is the fake's alone, so it opens only
// on pages that load from the API.
const seedProjects = (): Project[] => projectFixtures.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) }));
let projects = seedProjects();
let steppedUpUntil = 0;
const failures = new Map<string, Problem>();

// Answers.

const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z"); // utc_datetime: whole seconds, like Lightning
// Lightning's `mask_token`: "..." and the last ten characters.
const mask = (token: string) => "..." + token.slice(-10);

const titles: Record<number, string> = { 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 422: "Unprocessable Content" };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const problem = ({ status, code, detail = "The server could not complete that request.", errors }: Problem) =>
  json(status, { type: "about:blank", status, title: titles[status] ?? "Error", code, detail, ...(errors ? { errors } : {}) });
const noContent = () => new Response(null, { status: 204 });
const forbidden = () => problem({ status: 403, code: "forbidden", detail: "You are not allowed to do that." });
// One 422 for every problem with a body (api/errors.md).
const invalid = (errors: NonNullable<Problem["errors"]>) =>
  problem({ status: 422, code: "invalid", detail: "The request body is not valid.", errors });
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Links are absolute, like Lightning's; the client keeps only the path.
const ORIGIN = "http://localhost:4000";
/**
 * One page of a list (api/conventions.md): `page` from 1, `page_size` 10 by
 * default and at most 100, and links that carry the query as sent.
 */
function paged<T>(path: string, rows: T[], query: URLSearchParams, key = "data") {
  const size = Math.min(Math.max(Number(query.get("page_size")) || 10, 1), 100);
  const last = Math.max(Math.ceil(rows.length / size), 1);
  const page = Math.min(Math.max(Number(query.get("page")) || 1, 1), last);
  const link = (n: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(n));
    q.set("page_size", String(size));
    return `${ORIGIN}${path}?${q}`;
  };
  return {
    [key]: rows.slice((page - 1) * size, page * size),
    links: { self: link(page), first: link(1), last: link(last), next: page < last ? link(page + 1) : null, prev: page > 1 ? link(page - 1) : null },
  };
}

// A project as GET /api/projects/:id answers it; the list leaves out members. parent_id and
// color are planned on both; the list sends them with the planned depth=all.
const projectEntry = (p: Project, { members = true, stats = false, tree = true } = {}) => ({
  type: "projects",
  id: p.id,
  attributes: {
    name: p.name,
    description: p.description || null,
    ...(tree && { parent_id: openParentId(p), color: p.color }),
    ...(members && { members: p.members.map((m) => ({ email: findUser(m.userId)?.email ?? null, role: m.role })) }),
    ...(stats && projectStats(p)),
  },
  relationships: {},
  links: { self: `${ORIGIN}/api/projects/${p.id}` },
});

// Planned `permissions` on GET /api/projects/:id (api/projects.md), from the same rules as permissions.ts.
const PERMISSIONS: Record<string, keyof Permissions> = {
  access_project: "canAccessProject",
  delete_project: "canDeleteProject",
  edit_project: "canEditProject",
  edit_data_retention: "canEditDataRetention",
  edit_run_settings: "canEditRunSettings",
  add_project_user: "canAddProjectUser",
  remove_project_user: "canRemoveProjectUser",
  write_webhook_auth_method: "canWriteWebhookAuthMethod",
  write_github_connection: "canInstallGithub",
  create_workflow: "canCreateWorkflow",
  edit_workflow: "canEditWorkflow",
  delete_workflow: "canDeleteWorkflow",
  run_workflow: "canRunWorkflow",
  create_project_credential: "canCreateProjectCredential",
  initiate_github_sync: "canInitiateGithubSync",
  create_channel: "canCreateChannel",
  update_channel: "canEditChannel",
  delete_channel: "canDeleteChannel",
  edit_failure_alerts: "canEditFailureAlerts",
  edit_digest_alerts: "canEditDigestAlerts",
  create_keychain_credential: "canCreateKeychainCredential",
  manage_collection: "canCreateCollection",
  provision_sandbox: "canCreateSandbox",
};
const permissionsIn = (p: Project) => {
  const can = permissionsFor(p, session.user);
  return Object.fromEntries(Object.entries(PERMISSIONS).map(([name, flag]) => [name, can[flag]]));
};

/** A 400 for a `sort` field the route doesn't take (api/conventions.md). */
const badSort = (field: string) =>
  problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: `${field} is not a sort field`, parameter: "sort" }] });

// The fields GET /api/projects/:id/workflows sorts by (planned); last_work_order_updated_at needs include=stats.
type WorkflowStatsRow = ReturnType<typeof workflowStatsFor>[number];
const workflowSorts: Record<string, (s: WorkflowStatsRow) => SortValue> = {
  name: (s) => s.workflow.name,
  updated_at: (s) => s.workflow.updatedAt,
  last_work_order_updated_at: (s) => s.lastWorkOrder?.updatedAt ?? null,
};

// A workflow as the list answers it. jobs, triggers and edges are left out: no page reads them from here yet.
const workflowEntry = (s: WorkflowStatsRow, stats: boolean) => ({
  id: s.workflow.id,
  name: s.workflow.name,
  project_id: s.workflow.projectId,
  inserted_at: s.workflow.insertedAt,
  updated_at: s.workflow.updatedAt,
  ...(stats && {
    stats: { last_work_order: s.lastWorkOrder && { state: s.lastWorkOrder.state, updated_at: s.lastWorkOrder.updatedAt } },
  }),
});

/** A 400 for an `include` the route doesn't know (api/conventions.md). */
function badInclude(query: URLSearchParams, known: string[]) {
  const unknown = (query.get("include") ?? "").split(",").filter((v) => v && !known.includes(v));
  return unknown.length
    ? problem({ status: 400, code: "invalid_parameter", errors: unknown.map((v) => ({ code: "invalid", detail: `${v} is not a known include`, parameter: "include" })) })
    : undefined;
}

const DAY_MS = 86_400_000;
const roleOf = (p: Project) => p.members.find((m) => m.userId === session.user.id)?.role;
// Membership is per project: a sandbox copies its parent's members when it's made.
const canOpen = (p: Project) => !!roleOf(p);
// The nearest project above that you can open, or null (api/projects.md, depth=all).
const openParentId = (p: Project): string | null => {
  const parent = projects.find((q) => q.id === p.parentId);
  return !parent ? null : canOpen(parent) ? parent.id : openParentId(parent);
};
const projectStats = (p: Project) => {
  const workflows = workflowsIn(p.id);
  return {
    role: roleOf(p),
    workflows_count: workflows.length,
    collaborators_count: p.members.length,
    last_activity: workflows.map((w) => w.updatedAt).sort().at(-1) ?? null,
    failed_work_orders_count: workOrdersIn(p.id).filter(
      (w) => (FAILURE_STATES as readonly string[]).includes(w.state) && Date.now() - Date.parse(w.insertedAt) < 30 * DAY_MS
    ).length,
  };
};

const PROJECT_KEYS = ["id", "name", "description", "members", "notify"];
const PROJECT_NAME = /^[a-z0-9-]+$/;

const sessionData = () => ({
  data: {
    state: "signed_in",
    user_id: session.user.id,
    stepped_up_until: steppedUpUntil > Date.now() ? new Date(steppedUpUntil).toISOString() : null,
    csrf_token: "fake-csrf-token",
    pending_signup: null,
  },
});

// Every refused sign-in or step-up is the same 401, whatever was wrong.
const invalidCredentials = () =>
  problem({ status: 401, code: "invalid_credentials", detail: "The email, password or code is not valid." });

const routes: Record<string, Handler> = {
  "GET /api/session": () => json(200, sessionData()),
  "POST /api/session": (_params, body) => {
    // Signing in: the fake is always signed in as the session fixture's user, so this only checks the details.
    if (body["email"] !== undefined) {
      return body["email"] === session.user.email && body["password"] === FAKE_PASSWORD ? json(201, sessionData()) : invalidCredentials();
    }
    // Signed in, the password or an MFA code again steps the session up for five minutes. A backup code doesn't.
    const ok = body["password"] !== undefined ? body["password"] === FAKE_PASSWORD : body["mfa_code"] === FAKE_MFA_CODE;
    if (!ok) return invalidCredentials();
    steppedUpUntil = Date.now() + STEP_UP_MS;
    return json(201, sessionData());
  },

  // Newest first, masked, not paged.
  "GET /api/me/tokens": () => json(200, { data: tokens }),
  // Needs a stepped-up session. The whole token, this once; the list keeps only its mask.
  "POST /api/me/tokens": () => {
    if (steppedUpUntil <= Date.now()) {
      return problem({ status: 403, code: "step_up_required", detail: "Enter your password or an MFA code again to do this." });
    }
    const created = { id: crypto.randomUUID(), token: `demo.fake-token-not-real.${crypto.randomUUID()}`, inserted_at: now(), last_used_at: null };
    tokens = [{ ...created, token: mask(created.token) }, ...tokens];
    return json(201, { data: created });
  },
  "DELETE /api/me/tokens/:id": ({ id }) => {
    if (!tokens.some((t) => t.id === id)) return problem({ status: 404, code: "not_found", detail: "Not found." });
    tokens = tokens.filter((t) => t.id !== id);
    return noContent();
  },

  // Answers recorded from a real Lightning, replayed as they are.
  "GET /api/credentials": () => json(200, credentials),

  // api/projects.md. include=stats, and creating as any user, are planned: not in Lightning yet.
  "GET /api/projects": (_params, _body, query) => {
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    // Root projects you're a member of; with the planned depth=all, every sandbox you can open too.
    const tree = query.get("depth") === "all";
    const rows = projects
      .filter((p) => canOpen(p) && (tree || p.parentId === null))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => projectEntry(p, { members: false, stats, tree }));
    return json(200, paged("/api/projects", rows, query));
  },
  // api/workflows.md "List workflows". sort, include=stats (only last_work_order here) and paging are planned.
  "GET /api/projects/:id/workflows": ({ id }, _body, query) => {
    const project = projects.find((p) => p.id === id);
    // 403 whether or not the project exists.
    if (!project || !canOpen(project)) return forbidden();
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    const sort = query.get("sort") ?? "name";
    const field = sort.replace(/^-/, "");
    const by = workflowSorts[field];
    if (!by || (field === "last_work_order_updated_at" && !stats)) return badSort(field);
    const rows = workflowStatsFor(project.id)
      .sort(compareBy(by, sort.startsWith("-") ? "desc" : "asc", "last"))
      .map((s) => workflowEntry(s, stats));
    return json(200, paged(`/api/projects/${id}/workflows`, rows, query, "workflows"));
  },
  // A non-member hears 403 whether or not the project exists; only a superuser hears 404.
  "GET /api/projects/:id": ({ id }) => {
    if (!isUuid(id!) && session.user.role === "superuser") {
      return problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: "is not a UUID", path: "id" }] });
    }
    const project = projects.find((p) => p.id === id);
    if (project && canOpen(project)) {
      const entry = projectEntry(project);
      return json(200, { data: { ...entry, attributes: { ...entry.attributes, permissions: permissionsIn(project) } }, included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
    }
    if (!project && session.user.role === "superuser") return problem({ status: 404, code: "not_found", detail: "Not found." });
    return forbidden();
  },
  // Creates the project under :id, the caller its owner, or replaces the name and description.
  "PUT /api/projects/:id": ({ id }, body) => {
    if (!isUuid(id!)) return forbidden();
    const existing = projects.find((p) => p.id === id);
    if (existing && !["owner", "admin"].includes(roleOf(existing) ?? "")) return forbidden();
    const errors: NonNullable<Problem["errors"]> = Object.keys(body)
      .filter((key) => !PROJECT_KEYS.includes(key))
      .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
    const name = body["name"];
    const description = body["description"] ?? null;
    if (typeof name !== "string" || name === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/name" });
    else if (!PROJECT_NAME.test(name)) errors.push({ code: "format", detail: "has invalid format", pointer: "#/name" });
    if (description !== null && typeof description !== "string") errors.push({ code: "type", detail: "is not a string", pointer: "#/description" });
    else if (typeof description === "string" && description.length > 240) {
      errors.push({ code: "too_long", detail: "should be at most 240 character(s)", pointer: "#/description" });
    }
    if (body["id"] !== undefined && body["id"] !== id) errors.push({ code: "mismatch", detail: "does not match the path", pointer: "#/id" });
    if (errors.length) return invalid(errors);
    const fields = { name: name as string, description: (description as string | null) ?? "" };
    if (existing) {
      Object.assign(existing, fields);
      return json(200, { data: projectEntry(existing), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
    }
    const at = now();
    const created: Project = {
      id: id!,
      ...fields,
      parentId: null,
      color: null,
      concurrency: null,
      retentionPolicy: "retain_all",
      historyRetentionPeriod: null,
      dataclipRetentionPeriod: null,
      requiresMfa: false,
      members: [{ userId: session.user.id, role: "owner", failureAlert: true, digest: "never" }],
      lastUpdatedAt: at,
      insertedAt: at,
    };
    projects = [...projects, created];
    return json(201, { data: projectEntry(created), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
  },
};

/** The route a path matches (`"DELETE /api/me/tokens/:id"`) and its path parameters. */
function match(method: string, path: string): [string, Record<string, string>] | undefined {
  for (const key of Object.keys(routes)) {
    const [routeMethod, pattern] = key.split(" ") as [string, string];
    if (routeMethod !== method) continue;
    const names: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, name: string) => (names.push(name), "([^/]+)")) + "$");
    const found = regex.exec(path);
    if (found) return [key, Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(found[i + 1]!)]))];
  }
  return undefined;
}

/** Answers a request as Lightning would. Same arguments as `fetch`, for paths under /api. */
export async function fakeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
  const [path, search = ""] = input.split("?") as [string, string?];
  const found = match(init.method ?? "GET", path);
  // Unknown routes are a 404 problem document (api/errors.md).
  if (!found) return problem({ status: 404, code: "not_found", detail: `The fake server has no route for ${init.method ?? "GET"} ${path}.` });
  const [key, params] = found;
  const failure = failures.get(key);
  if (failure) {
    failures.delete(key);
    return problem(failure);
  }
  const body = typeof init.body === "string" ? (JSON.parse(init.body) as Body) : {};
  return routes[key]!(params, body, new URLSearchParams(search));
}

/** For stories and tests: the next request to this route (`"POST /api/me/tokens"`) is refused with this problem. */
export function failNext(route: string, failure: Problem) {
  failures.set(route, failure);
}

/** For stories and tests: the starting data, not stepped up, nothing set to fail. */
export function resetFakeApi() {
  tokens = seed();
  projects = seedProjects();
  steppedUpUntil = 0;
  failures.clear();
}

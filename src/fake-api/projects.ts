/** Projects on the pretend server (api/projects.md). */
import { findUser } from "@/mock-data/users";
import { projects as projectFixtures } from "@/mock-data/projects";
import { workflowsIn } from "@/mock-data/workflows";
import { workOrdersIn } from "@/mock-data/history";
import { workflowStatsFor } from "@/mock-data/dashboard-stats";
import { permissionsFor, type Permissions } from "@/permissions";
import type { Project, ProjectAction } from "@/types/projects";
import type { WorkflowSortKey } from "@/types/workflows";
import { compareBy, type SortValue } from "@/utils/useTableSort";
import { FAILURE_STATES } from "@/types/workflow-health";
import { badInclude, badSort, forbidden, invalid, isUuid, json, now, ORIGIN, paged, problem, type Handler, type Problem } from "./answers";
import { currentUser } from "./session";

// The fake's own copy, like tokens: a project made here is the fake's alone, so it opens only
// on pages that load from the API.
const seedProjects = (): Project[] => projectFixtures.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) }));
let projects = seedProjects();

/** For stories and tests: the starting projects. */
export const resetProjects = () => {
  projects = seedProjects();
};

/** A project as the fake holds it, for the routes of what lives inside one. */
export const findProject = (id: string | undefined) => projects.find((p) => p.id === id);

// A project as GET /api/projects/:id answers it; the list leaves out members. requires_mfa,
// parent_id, color and a sandbox's display_name are planned on both; the list sends parent_id
// and color with the planned depth=all.
const projectEntry = (p: Project, { members = true, stats = false, tree = true } = {}) => ({
  type: "projects",
  id: p.id,
  attributes: {
    name: p.name,
    description: p.description || null,
    requires_mfa: p.requiresMfa,
    ...(p.parentId !== null && { display_name: displayName(p) }),
    ...(tree && { parent_id: openParentId(p), color: p.color, ...(p.parentId !== null && { root_id: rootOf(p).id }) }),
    ...(members && { members: p.members.map((m) => ({ email: findUser(m.userId)?.email ?? null, role: m.role })) }),
    ...(stats && projectStats(p)),
  },
  relationships: {},
  links: { self: `${ORIGIN}/api/projects/${p.id}` },
});

const DAY_MS = 86_400_000;
const roleOf = (p: Project) => p.members.find((m) => m.userId === currentUser().id)?.role;
// Membership is per project: a sandbox copies its parent's members when it's made.
const canOpen = (p: Project) => !!roleOf(p);
// A member without MFA is refused every route on a project that requires it; the list still shows it.
const canEnter = (p: Project) => canOpen(p) && (!p.requiresMfa || currentUser().mfaEnabled);
const rootOf = (p: Project): Project => {
  const parent = projects.find((q) => q.id === p.parentId);
  return parent ? rootOf(parent) : p;
};
const displayName = (p: Project): string => {
  const parent = projects.find((q) => q.id === p.parentId);
  return parent ? `${displayName(parent)}/${p.name}` : p.name;
};
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

// Planned `permissions` on GET /api/projects/:id (api/projects.md), from the same rules as permissions.ts.
const PERMISSIONS: Record<ProjectAction, keyof Permissions> = {
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
  const can = permissionsFor(p, currentUser());
  return Object.fromEntries(Object.entries(PERMISSIONS).map(([name, flag]) => [name, can[flag]]));
};

// The fields GET /api/projects/:id/workflows sorts by (planned); all but the first two need include=stats.
type WorkflowStatsRow = ReturnType<typeof workflowStatsFor>[number];
const workflowSorts: Record<WorkflowSortKey | "work_orders_count" | "failed_work_orders_count", (s: WorkflowStatsRow) => SortValue> = {
  name: (s) => s.workflow.name,
  updated_at: (s) => s.workflow.updatedAt,
  last_work_order_updated_at: (s) => s.lastWorkOrder?.updatedAt ?? null,
  work_orders_count: (s) => s.workordersCount,
  failed_work_orders_count: (s) => s.failedWorkordersCount,
};
const isWorkflowSort = (field: string): field is keyof typeof workflowSorts => field in workflowSorts;

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

const PROJECT_KEYS = ["id", "name", "description", "members", "notify"];
const PROJECT_NAME = /^[a-z0-9-]+$/;

export const projectRoutes: Record<string, Handler> = {
  // api/projects.md. include=stats, and creating as any user, are planned: not in Lightning yet.
  "GET /api/projects": (_params, _body, query) => {
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    // Root projects you're a member of, a superuser too; with the planned depth=all, every sandbox you can open too.
    // scope=all is ahead of the API (docs/api-gaps.md, Superuser access): every project and sandbox on the
    // instance, for the admin pages, and superusers only. The fixtures schedule none for deletion.
    const tree = query.get("depth") === "all";
    const everything = query.get("scope") === "all";
    if (everything && currentUser().role !== "superuser") return forbidden();
    const rows = projects
      .filter((p) => everything || (canOpen(p) && (tree || p.parentId === null)))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => projectEntry(p, { members: false, stats, tree }));
    return json(200, paged("/api/projects", rows, query));
  },
  // api/workflows.md "List workflows". sort, include=stats (only last_work_order here) and paging are planned.
  "GET /api/projects/:id/workflows": ({ id }, _body, query) => {
    const project = projects.find((p) => p.id === id);
    // 403 whether or not the project exists.
    if (!project || !canEnter(project)) return forbidden();
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    const sort = query.get("sort") ?? "name";
    const field = sort.replace(/^-/, "");
    if (!isWorkflowSort(field) || (!stats && field !== "name" && field !== "updated_at")) return badSort(field);
    const desc = sort.startsWith("-");
    // Nulls last either way: compareBy reverses them along with everything else when descending.
    const rows = workflowStatsFor(project.id)
      .sort(compareBy(workflowSorts[field], desc ? "desc" : "asc", desc ? "first" : "last"))
      .map((s) => workflowEntry(s, stats));
    return json(200, paged(`/api/projects/${id}/workflows`, rows, query, "workflows"));
  },
  // A non-member hears 403 whether or not the project exists; only a superuser hears 404.
  "GET /api/projects/:id": ({ id }) => {
    if (!isUuid(id!) && currentUser().role === "superuser") {
      return problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: "is not a UUID", path: "id" }] });
    }
    const project = projects.find((p) => p.id === id);
    if (project && canEnter(project)) {
      const entry = projectEntry(project);
      return json(200, { data: { ...entry, attributes: { ...entry.attributes, permissions: permissionsIn(project) } }, included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
    }
    if (!project && currentUser().role === "superuser") return problem({ status: 404, code: "not_found", detail: "Not found." });
    return forbidden();
  },
  // Creates the project under :id, the caller its owner, or replaces the name and description.
  "PUT /api/projects/:id": ({ id }, body) => {
    if (!isUuid(id!)) return forbidden();
    const existing = projects.find((p) => p.id === id);
    if (existing && (!canEnter(existing) || !["owner", "admin"].includes(roleOf(existing) ?? ""))) return forbidden();
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
      members: [{ userId: currentUser().id, role: "owner", failureAlert: true, digest: "never" }],
      lastUpdatedAt: at,
      insertedAt: at,
    };
    projects = [...projects, created];
    return json(201, { data: projectEntry(created), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
  },
};

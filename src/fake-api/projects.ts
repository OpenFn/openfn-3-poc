/** Projects on the pretend server (api/projects.md). */
import { sandboxColorPalette } from "@/constants";
import { findUser } from "@/mock-data/users";
import { projects as projectFixtures } from "@/mock-data/projects";
import { workflowsIn } from "@/mock-data/workflows";
import { workOrdersIn } from "@/mock-data/history";
import { workflowStatsFor } from "@/mock-data/dashboard-stats";
import type { Project } from "@/types/projects";
import type { WorkflowSortKey } from "@/types/workflows";
import { fullName } from "@/utils/format";
import { matchesQuery } from "@/utils/search";
import { compareBy, type SortValue } from "@/utils/useTableSort";
import { FAILURE_STATES } from "@/types/workflow-health";
import { badInclude, badSort, forbidden, invalid, isUuid, json, noContent, notFound, now, ORIGIN, paged, parseSort, problem, SEEDED_AT, type Handler, type Problem } from "./answers";
import { membersOf } from "./members";
import { permissionsIn } from "./permissions";
import { currentUser, people, PURGE_DELETED_AFTER_DAYS } from "./session";

// The fake's own copy, like tokens: a project made here is the fake's alone, so it opens only
// on pages that load from the API.
export const DAY_MS = 86_400_000;
const OLD_IMPORT_TEST = "2b3c4d5e-6f70-4a81-92b3-c4d5e6f70a81";
const seedProjects = (): Project[] => [
  ...projectFixtures.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) })),
  // One with no owner and no members, as Lightning has once its only member's account is removed; every fixture has an owner.
  { ...projectFixtures[0]!, id: "5b2e8f41-6c3d-4e7a-9b1f-2d4c6e8a0b13", name: "legacy-imports", description: "Imports from the old reporting server.", members: [], insertedAt: "2023-11-20T09:00:00Z" },
  // A sandbox of openhie-project scheduled for deletion (seedScheduled), so the sandboxes page has one to restore.
  { ...projectFixtures[0]!, id: OLD_IMPORT_TEST, name: "old-import-test", description: "", parentId: projectFixtures[0]!.id, color: sandboxColorPalette[11]!, insertedAt: SEEDED_AT },
];
let projects = seedProjects();
// When each scheduled project is purged, by id.
const seedScheduled = () => new Map([[OLD_IMPORT_TEST, now(new Date(Date.now() + 3 * DAY_MS))]]);
let scheduled = seedScheduled();

export { permissionsIn };

/** The projects as the fake holds them now. */
export const fakeProjects = () => projects;
export const isMemberOf = (projectId: string, userId: string) => !!projects.find((p) => p.id === projectId)?.members.some((m) => m.userId === userId);
/** Whether the signed-in user is an editor or above in a project, as sharing a credential or client there needs. */
export const isEditorIn = (projectId: string) =>
  ["owner", "admin", "editor"].includes(projects.find((p) => p.id === projectId)?.members.find((m) => m.userId === currentUser().id)?.role ?? "");

/** For stories and tests: the starting projects. */
export const resetProjects = () => {
  projects = seedProjects();
  scheduled = seedScheduled();
};
export const addProject = (p: Project) => void (projects = [...projects, p]);
export const isScheduled = (id: string) => scheduled.has(id);
/** A project and every sandbox below it. */
export const treeOf = (p: Project): Project[] => [p, ...projects.filter((c) => c.parentId === p.id).flatMap(treeOf)];
/** Schedules a project and every sandbox below it with one date, or cancels them all with null, as Lightning does. */
export const scheduleTree = (p: Project, at: string | null) => treeOf(p).forEach((x) => (at ? scheduled.set(x.id, at) : scheduled.delete(x.id)));

/** A project as the fake holds it, for the routes of what lives inside one. */
export const findProject = (id: string | undefined) => projects.find((p) => p.id === id);

// A project as GET /api/projects/:id answers it; the list leaves out members. requires_mfa,
// parent_id, color, scheduled_deletion and a sandbox's display_name are planned on both; the list
// sends parent_id and color with the planned depth=all, and inserted_at and owner with scope=all.
export const projectEntry = (p: Project, { members = true, stats = false, tree = true, admin = false } = {}) => ({
  type: "projects",
  id: p.id,
  attributes: {
    name: p.name,
    description: p.description || null,
    requires_mfa: p.requiresMfa,
    scheduled_deletion: scheduled.get(p.id) ?? null,
    ...(admin && { inserted_at: p.insertedAt, owner: ownerJson(p) }),
    ...(p.parentId !== null && { display_name: displayName(p) }),
    ...(tree && { parent_id: openParentId(p), color: p.color, ...(p.parentId !== null && { root_id: rootOf(p).id }) }),
    ...(members && { members: p.members.map((m) => ({ email: findUser(m.userId)?.email ?? null, role: m.role })) }),
    ...(stats && projectStats(p)),
  },
  relationships: {},
  links: { self: `${ORIGIN}/api/projects/${p.id}` },
});

export const roleOf = (p: Project) => p.members.find((m) => m.userId === currentUser().id)?.role;
const ownerOf = (p: Project) => people.find((u) => u.id === p.members.find((m) => m.role === "owner")?.userId);
const ownerJson = (p: Project) => {
  const owner = ownerOf(p);
  return owner ? { id: owner.id, email: owner.email, first_name: owner.firstName, last_name: owner.lastName } : null;
};
/** An owner or admin of the project, or of the one at the top of its tree: who may rename, recolour, delete, restore and merge a sandbox. */
export const managesSandbox = (p: Project) => [roleOf(p), roleOf(rootOf(p))].some((r) => r === "owner" || r === "admin");
// Membership is per project: a sandbox copies its parent's members when it's made.
const canOpen = (p: Project) => !!roleOf(p);
// A member without MFA is refused every route on a project that requires it; the list still shows it.
export const canEnter = (p: Project) => canOpen(p) && (!p.requiresMfa || currentUser().mfaEnabled);
export const rootOf = (p: Project): Project => {
  const parent = findProject(p.parentId ?? undefined);
  return parent ? rootOf(parent) : p;
};
const displayName = (p: Project): string => {
  const parent = findProject(p.parentId ?? undefined);
  return parent ? `${displayName(parent)}/${p.name}` : p.name;
};
// The nearest project above that you can open, or null (api/projects.md, depth=all).
const openParentId = (p: Project): string | null => {
  const parent = findProject(p.parentId ?? undefined);
  return !parent ? null : canOpen(parent) ? parent.id : openParentId(parent);
};
const lastActivity = (p: Project) => workflowsIn(p.id).map((w) => w.updatedAt).sort().at(-1) ?? null;
const projectStats = (p: Project) => {
  const workflows = workflowsIn(p.id);
  return {
    role: roleOf(p) ?? null,
    workflows_count: workflows.length,
    collaborators_count: p.members.length,
    last_activity: lastActivity(p),
    failed_work_orders_count: workOrdersIn(p.id).filter(
      (w) => (FAILURE_STATES as readonly string[]).includes(w.state) && Date.now() - Date.parse(w.insertedAt) < 30 * DAY_MS
    ).length,
  };
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

const PROJECT_KEYS = ["id", "name", "description", "members", "notify", "color"];
export const PROJECT_NAME = /^[a-z0-9-]+$/;
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
export const SANDBOX_NAME_TAKEN = "Sandbox name already exists";
// The fields GET /api/projects sorts by (planned).
const projectSorts: Record<"name" | "inserted_at" | "last_activity", (p: Project) => SortValue> = { name: (p) => p.name, inserted_at: (p) => p.insertedAt, last_activity: (p) => lastActivity(p) };

// Deleting, and cancelling a deletion, is for the project's owner, a sandbox's admins and the owners and admins at the top
// of its tree, and (planned) any superuser. Unknown to a superuser is a 404; to anyone else, 403 either way.
function deletable(id: string | undefined): Project | Response {
  const project = findProject(id);
  const superuser = currentUser().role === "superuser";
  if (!project) return superuser ? notFound() : forbidden();
  if (superuser || (canEnter(project) && (roleOf(project) === "owner" || (project.parentId !== null && managesSandbox(project))))) return project;
  return forbidden();
}

export const projectRoutes: Record<string, Handler> = {
  // api/projects.md. include=stats, sort, q, and creating as any user, are planned: not in Lightning yet.
  "GET /api/projects": (_params, _body, query) => {
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    const { field, key, direction } = parseSort(query, projectSorts, "name");
    if (!key) return badSort(field);
    // Root projects you're a member of and not scheduled for deletion, a superuser too; with the planned depth=all,
    // every sandbox you can open too. scope=all is ahead of the API (docs/api-gaps.md, Superuser access): every project
    // and sandbox on the instance, scheduled ones included, for the admin pages, and superusers only. Only it takes q.
    const tree = query.get("depth") === "all";
    const everything = query.get("scope") === "all";
    if (everything && currentUser().role !== "superuser") return forbidden();
    const q = everything ? (query.get("q") ?? "") : "";
    const rows = projects
      .filter((p) => everything || (canOpen(p) && !scheduled.has(p.id) && (tree || p.parentId === null)))
      .filter((p) => {
        const owner = ownerOf(p);
        return matchesQuery(q, p.name, p.description, owner && fullName(owner));
      })
      .sort(compareBy(projectSorts[key], direction))
      .map((p) => projectEntry(p, { members: false, stats, tree, admin: everything }));
    return json(200, paged("/api/projects", rows, query));
  },
  // api/workflows.md "List workflows". sort, include=stats (only last_work_order here) and paging are planned.
  "GET /api/projects/:id/workflows": ({ id }, _body, query) => {
    const project = findProject(id);
    // 403 whether or not the project exists.
    if (!project || !canEnter(project)) return forbidden();
    const refused = badInclude(query, ["stats"]);
    if (refused) return refused;
    const stats = query.get("include") === "stats";
    const { field, key, direction } = parseSort(query, workflowSorts, "name");
    if (!key || (!stats && key !== "name" && key !== "updated_at")) return badSort(field);
    // Nulls last either way: compareBy reverses them along with everything else when descending.
    const rows = workflowStatsFor(project.id)
      .sort(compareBy(workflowSorts[key], direction, direction === "desc" ? "first" : "last"))
      .map((s) => workflowEntry(s, stats));
    return json(200, paged(`/api/projects/${id}/workflows`, rows, query, "workflows"));
  },
  // A non-member hears 403 whether or not the project exists; only a superuser hears 404.
  "GET /api/projects/:id": ({ id }) => {
    if (!isUuid(id!) && currentUser().role === "superuser") {
      return problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: "is not a UUID", path: "id" }] });
    }
    const project = findProject(id);
    if (project && canEnter(project)) {
      const entry = projectEntry(project);
      // limits is planned; the seed's plan always has room for another sandbox.
      const attributes = { ...entry.attributes, permissions: permissionsIn(project), limits: { sandboxes: { allowed: true, message: null } } };
      return json(200, { data: { ...entry, attributes }, included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
    }
    if (!project && currentUser().role === "superuser") return notFound();
    return forbidden();
  },
  // Creates the project under :id, or replaces the name, description and (planned) colour; a sandbox's root admins may too. A new
  // project's owner is the caller, unless a superuser sends its `members`. `notify` is accepted and ignored: the fake sends no email.
  "PUT /api/projects/:id": ({ id }, body) => {
    if (!isUuid(id!)) return forbidden();
    const existing = findProject(id);
    if (existing && (!canEnter(existing) || !managesSandbox(existing))) return forbidden();
    const errors: NonNullable<Problem["errors"]> = Object.keys(body)
      .filter((key) => !PROJECT_KEYS.includes(key))
      .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
    const name = body["name"];
    const description = body["description"] ?? null;
    if (typeof name !== "string" || name === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/name" });
    else if (!PROJECT_NAME.test(name)) errors.push({ code: "format", detail: "has invalid format", pointer: "#/name" });
    else if (existing?.parentId && projects.some((p) => p.parentId === existing.parentId && p.name === name && p.id !== existing.id)) {
      errors.push({ code: "taken", detail: SANDBOX_NAME_TAKEN, pointer: "#/name" });
    }
    const color = body["color"];
    if (color !== undefined && color !== null && !(typeof color === "string" && HEX_COLOR.test(color))) errors.push({ code: "format", detail: "is not a hex colour", pointer: "#/color" });
    if (description !== null && typeof description !== "string") errors.push({ code: "type", detail: "is not a string", pointer: "#/description" });
    else if (typeof description === "string" && description.length > 240) {
      errors.push({ code: "too_long", detail: "should be at most 240 character(s)", pointer: "#/description" });
    }
    if (body["id"] !== undefined && body["id"] !== id) errors.push({ code: "mismatch", detail: "does not match the path", pointer: "#/id" });
    const members =
      !existing && body["members"] !== undefined && currentUser().role === "superuser"
        ? membersOf(body["members"], errors)
        : [{ userId: currentUser().id, role: "owner" as const, failureAlert: true, digest: "never" as const }];
    if (errors.length) return invalid(errors);
    const fields = { name: name as string, description: (description as string | null) ?? "", ...(color !== undefined && { color: color as string | null }) };
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
      members,
      lastUpdatedAt: at,
      insertedAt: at,
    };
    projects = [...projects, created];
    return json(201, { data: projectEntry(created), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
  },
  "DELETE /api/projects/:id": ({ id }) => {
    const project = deletable(id);
    if (project instanceof Response) return project;
    if (scheduled.has(project.id)) {
      return problem({ status: 409, code: "scheduled_for_deletion", detail: "This project is already scheduled for deletion." });
    }
    scheduleTree(project, now(new Date(Date.now() + PURGE_DELETED_AFTER_DAYS * DAY_MS)));
    return noContent();
  },
  "DELETE /api/projects/:id/scheduled_deletion": ({ id }) => {
    const project = deletable(id);
    if (project instanceof Response) return project;
    if (!scheduled.has(project.id)) return problem({ status: 404, code: "not_found", detail: "This project isn't scheduled for deletion." });
    scheduleTree(project, null);
    return json(200, { data: projectEntry(project), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
  },
};

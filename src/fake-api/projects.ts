/** Projects on the pretend server (api/projects.md). */
import { findUser, session } from "@/mock-data/users";
import { projects as projectFixtures } from "@/mock-data/projects";
import { workflowsIn } from "@/mock-data/workflows";
import { workOrdersIn } from "@/mock-data/history";
import type { Project } from "@/types/projects";
import { FAILURE_STATES } from "@/types/workflow-health";
import { badInclude, forbidden, invalid, isUuid, json, now, ORIGIN, paged, problem, type Handler, type Problem } from "./answers";

// The fake's own copy, like tokens: a project made here is the fake's alone, so it opens only
// on pages that load from the API.
const seedProjects = (): Project[] => projectFixtures.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) }));
let projects = seedProjects();

/** For stories and tests: the starting projects. */
export const resetProjects = () => {
  projects = seedProjects();
};

// A project as GET /api/projects/:id answers it; the list leaves out members. parent_id and
// color are planned on both; the list sends them with the planned depth=all.
const projectEntry = (p: Project, { members = true, stats = false, tree = true } = {}) => ({
  type: "projects",
  id: p.id,
  attributes: {
    name: p.name,
    description: p.description || null,
    ...(tree && { parent_id: openParentId(p), color: p.color, ...(p.parentId !== null && { root_id: rootOf(p).id }) }),
    ...(members && { members: p.members.map((m) => ({ email: findUser(m.userId)?.email ?? null, role: m.role })) }),
    ...(stats && projectStats(p)),
  },
  relationships: {},
  links: { self: `${ORIGIN}/api/projects/${p.id}` },
});

const DAY_MS = 86_400_000;
const roleOf = (p: Project) => p.members.find((m) => m.userId === session.user.id)?.role;
// Membership is per project: a sandbox copies its parent's members when it's made.
const canOpen = (p: Project) => !!roleOf(p);
const rootOf = (p: Project): Project => {
  const parent = projects.find((q) => q.id === p.parentId);
  return parent ? rootOf(parent) : p;
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

const PROJECT_KEYS = ["id", "name", "description", "members", "notify"];
const PROJECT_NAME = /^[a-z0-9-]+$/;

export const projectRoutes: Record<string, Handler> = {
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
  // A non-member hears 403 whether or not the project exists; only a superuser hears 404.
  "GET /api/projects/:id": ({ id }) => {
    if (!isUuid(id!) && session.user.role === "superuser") {
      return problem({ status: 400, code: "invalid_parameter", errors: [{ code: "invalid", detail: "is not a UUID", path: "id" }] });
    }
    const project = projects.find((p) => p.id === id);
    if (project && canOpen(project)) return json(200, { data: projectEntry(project), included: [], links: { self: `${ORIGIN}/api/projects/${id}` } });
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

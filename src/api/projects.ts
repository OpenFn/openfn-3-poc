/** Projects on Lightning's API (api/projects.md, JSON:API): the API's shape, its mappers, its keys, and the hooks a .query file calls. */
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectAction, ProjectInput, ProjectNode } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import type { ProjectOverview } from "@/types/workflows";
import { isApiError, listAll, request, statusOf } from "./client";

/** A project as `GET /api/projects` lists it. The stats come with `include=stats`, which is planned. */
export interface ApiProject {
  id: string;
  attributes: {
    name: string;
    description: string | null;
    role?: ProjectOverview["role"];
    workflows_count?: number;
    collaborators_count?: number;
    last_activity?: string | null;
    /** Planned: on `GET /api/projects/:id`, and on the list with `depth=all`. */
    parent_id?: string | null;
    color?: string | null;
    /** Planned: a sandbox's project at the top of its tree. */
    root_id?: string;
    /** Planned (api/projects.md): whether members need MFA to open it. useRefusedForMfa depends on it. */
    requires_mfa?: boolean;
    /** Planned, on `GET /api/projects/:id`: what the caller may do here (`create_workflow`, …). */
    permissions?: Partial<Record<ProjectAction, boolean>>;
  };
}

/** A row of the projects dashboard, from an entry listed with `include=stats`. */
export function projectOverview({ id, attributes: a }: ApiProject): ProjectOverview {
  return {
    id,
    name: a.name,
    role: a.role ?? "viewer",
    workflowsCount: a.workflows_count ?? 0,
    collaboratorsCount: a.collaborators_count ?? 0,
    lastUpdatedAt: a.last_activity ?? null,
  };
}

export const projectKeys = { all: ["projects"] as const, one: (id: string) => ["projects", id] as const };

function projectNode({ id, attributes: a }: ApiProject): ProjectNode {
  return { id, name: a.name, parentId: a.parent_id ?? null, color: a.color ?? null, isSandbox: a.root_id !== undefined };
}

// `GET /api/projects/:id`, one cache entry for useProject and useProjectPermissions.
const projectQuery = (id: string | undefined) =>
  queryOptions({
    queryKey: projectKeys.one(id ?? ""),
    // No id (a page outside any project): nothing to load.
    enabled: id !== undefined,
    queryFn: () => request<{ data: ApiProject }>("GET", `/api/projects/${id}`).then((answer) => answer.data),
    // The gate and the page's .query file ask in turn; without this the page fetches it again.
    staleTime: 60_000,
  });

/** `GET /api/projects/:id`, and where loading it stands. A non-member gets `forbidden`. */
export function useProject(id: string | undefined): { status: ResourceStatus; project: ProjectNode | undefined } {
  const query = useQuery({ ...projectQuery(id), select: projectNode });
  // A malformed id is a 400 for a superuser (api/projects.md); to the person it's a project that isn't there.
  const status = isApiError(query.error, "invalid_parameter") ? ({ state: "notFound" } as const) : statusOf(query);
  return { status, project: query.data };
}

/**
 * The project a page under ProjectGate is in. The gate has already loaded it
 * and shown Not Found or No Access instead of the page, so it's always there:
 * never check. The page's .query file passes the :projectId from the URL.
 */
export function useCurrentProject(projectId: string): ProjectNode {
  const { project } = useProject(projectId);
  if (!project) throw new Error("useCurrentProject is for pages under ProjectGate, which loads the project first");
  return project;
}

const toTree = (rows: ApiProject[]) => rows.map(projectNode);

const treeQuery = queryOptions({
  queryKey: [...projectKeys.all, "tree"],
  queryFn: () => listAll<ApiProject>("/api/projects?depth=all", "data"),
});

/** Every project and sandbox you can open (the planned `depth=all`), for the project picker, and where loading them stands. */
export function useProjectTree(): { status: ResourceStatus; projects: ProjectNode[] } {
  const query = useQuery({ ...treeQuery, select: toTree });
  return { status: statusOf(query), projects: query.data ?? [] };
}

/**
 * Whether a refused project is refused for its MFA requirement rather than
 * for no access, or "checking" while that loads. The API answers both 403
 * `forbidden` (docs/api-gaps.md), but the list holds every project you're a
 * member of, so a listed project that requires MFA and still refuses you is
 * the MFA requirement. The picker has usually loaded the list already.
 */
export function useRefusedForMfa(id: string, refused: boolean): boolean | "checking" {
  const query = useQuery({
    ...treeQuery,
    enabled: refused,
    select: (rows) => rows.some((p) => p.id === id && p.attributes.requires_mfa),
  });
  if (!refused) return false;
  // Wait for a fresh list: a cached one may be from before you joined or MFA was turned on.
  if (query.isFetching) return "checking";
  return query.data ?? false;
}

// Your projects, never a sandbox, with your role in each.
const overviewsQuery = queryOptions({
  queryKey: [...projectKeys.all, "stats"],
  queryFn: () => listAll<ApiProject>("/api/projects?include=stats", "data"),
});

/** The signed-in person's projects with their counts and last activity, and where loading them stands. */
export function useProjectOverviews(): { status: ResourceStatus; projects: ProjectOverview[] } {
  const query = useQuery({ ...overviewsQuery, select: (rows) => rows.map(projectOverview) });
  return { status: statusOf(query), projects: query.data ?? [] };
}

const shareable = (rows: ApiProject[]) =>
  rows.filter((p) => ["owner", "admin", "editor"].includes(p.attributes.role ?? "")).map((p) => ({ id: p.id, name: p.attributes.name }));

/**
 * The projects you can share a credential or OAuth client with: those you
 * edit or own. A sandbox gets a share through its parent, as in Lightning.
 */
export function useShareableProjects(): { id: string; name: string }[] {
  return useQuery({ ...overviewsQuery, select: shareable }).data ?? [];
}

/**
 * Create. Resolves once the list has reloaded with the new project; rejects
 * with the `ApiError`, whose field errors are keyed `name` and `description`.
 * Creating as any user, who becomes the owner, is planned (api/projects.md).
 */
export function useProjectSaves() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (project: ProjectInput) =>
      request<{ data: ApiProject }>("PUT", `/api/projects/${crypto.randomUUID()}`, project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
  return { create: async (project: ProjectInput) => void (await create.mutateAsync(project)) };
}

/**
 * What the caller may do in a project, from the same `GET /api/projects/:id`
 * and cache as useProject (the planned `permissions`), by the API's names:
 * `can("create_workflow")`. False until it has loaded, and for anything the
 * server doesn't say.
 */
export function useProjectPermissions(id: string): (action: ProjectAction) => boolean {
  const { data } = useQuery({ ...projectQuery(id), select: (p) => p.attributes.permissions ?? {} });
  return (action) => data?.[action] ?? false;
}

/** Projects on Lightning's API (api/projects.md, JSON:API): the API's shape, its mappers, its keys, and the hooks a .query file calls. */
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminProjectFormValues, AdminProjectRow, AdminProjectSortKey } from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import type { ProjectAction, ProjectInput, ProjectNode } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import type { ProjectOverview } from "@/types/workflows";
import { fullName } from "@/utils/format";
import { isApiError, listAll, PAGE_SIZE, pageLinks, request, sortParam, statusOf } from "./client";

/** A project as `GET /api/projects` lists it. The stats come with `include=stats`, which is planned. */
export interface ApiProject {
  id: string;
  attributes: {
    name: string;
    description: string | null;
    role?: ProjectOverview["role"] | null;
    workflows_count?: number;
    collaborators_count?: number;
    last_activity?: string | null;
    /** Planned: on `GET /api/projects/:id`, and on the list with `depth=all`. */
    parent_id?: string | null;
    color?: string | null;
    /** Planned: a sandbox's project at the top of its tree. */
    root_id?: string;
    /** Planned: a sandbox's names from the root down, joined by "/" ("malaria-programme/staging"). */
    display_name?: string;
    /** Planned (api/projects.md): whether members need MFA to open it. useRefusedForMfa depends on it. */
    requires_mfa?: boolean;
    /** Planned, on `GET /api/projects/:id`: what the caller may do here (`create_workflow`, …). */
    permissions?: Partial<Record<ProjectAction, boolean>>;
  };
}

/** A project as a superuser's `GET /api/projects?scope=all&include=stats` lists it: every project on the instance, with its owner. */
interface ApiAdminProject extends ApiProject {
  attributes: ApiProject["attributes"] & {
    inserted_at: string;
    owner: { id: string; email: string; first_name: string; last_name: string } | null;
    scheduled_deletion: string | null;
    collaborators_count: number;
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

/** A row of the instance's projects table (/settings/projects). */
export function adminProjectRow({ id, attributes: a }: ApiAdminProject): AdminProjectRow {
  return {
    id,
    name: a.display_name ?? a.name,
    ownerName: a.owner && fullName({ firstName: a.owner.first_name, lastName: a.owner.last_name }),
    membersCount: a.collaborators_count,
    insertedAt: a.inserted_at,
    scheduledDeletion: a.scheduled_deletion,
  };
}

/** The `sort` fields the instance's list takes, so a query can check what the URL asks for. */
const ADMIN_SORT_KEYS: Record<AdminProjectSortKey, true> = { name: true, inserted_at: true };
export const isAdminProjectSortKey = (key: string | undefined): key is AdminProjectSortKey => key !== undefined && Object.hasOwn(ADMIN_SORT_KEYS, key);

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
 * Every project and sandbox on the instance (`scope=all`, superusers only,
 * ahead of the API: docs/api-gaps.md) as `[label, id]` options for an admin
 * form's project picker, sorted by label: a sandbox by its planned
 * `display_name` ("parent/sandbox"), so two with the same name can be told apart.
 */
export function useAllProjectOptions(): { status: ResourceStatus; options: [label: string, value: string][] } {
  const query = useQuery({
    queryKey: [...projectKeys.all, "all"],
    queryFn: () => listAll<ApiProject>("/api/projects?scope=all", "data"),
    select: (rows) =>
      rows.map((p): [string, string] => [p.attributes.display_name ?? p.attributes.name, p.id]).sort((a, b) => a[0].localeCompare(b[0])),
  });
  return { status: statusOf(query), options: query.data ?? [] };
}

/**
 * Whether a refused project is refused for its MFA requirement rather than
 * for no access, or "checking" while that loads. The API answers both 403
 * `forbidden` (docs/api-gaps.md), but the list holds every project you're a
 * member of, a superuser too (without `scope=all`), so a listed project that
 * requires MFA and still refuses you is the MFA requirement. The picker has
 * usually loaded the list already.
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
export function useShareableProjects(): { status: ResourceStatus; projects: { id: string; name: string }[] } {
  const query = useQuery({ ...overviewsQuery, select: shareable });
  return { status: statusOf(query), projects: query.data ?? [] };
}

/**
 * One page of every project on the instance (`scope=all`, superusers only,
 * ahead of the API), searched by name, description or owner and sorted by the
 * server, with each one's owner and member count; and where loading it stands.
 */
export function useAdminProjects({ q, sort, page }: { q: string; sort: SortState<AdminProjectSortKey>; page: number }): {
  status: ResourceStatus;
  projects: AdminProjectRow[];
  page: PageLinks;
} {
  const params = new URLSearchParams({ scope: "all", include: "stats", sort: sortParam(sort), page: String(page), page_size: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  const query = useQuery({
    queryKey: [...projectKeys.all, "admin", String(params)],
    queryFn: () => request<{ data: ApiAdminProject[]; links: { self: string; last: string } }>("GET", `/api/projects?${params}`),
    select: (answer) => ({ projects: answer.data.map(adminProjectRow), page: pageLinks(answer.links) }),
    placeholderData: keepPreviousData,
  });
  return { status: statusOf(query), projects: query.data?.projects ?? [], page: query.data?.page ?? { number: page, size: PAGE_SIZE, totalPages: 1 } };
}

/** A new project: a superuser may send its members (planned). */
type NewProject = ProjectInput & Partial<Pick<AdminProjectFormValues, "members">>;

/**
 * Create, schedule a deletion and cancel one. Each resolves once the lists
 * have reloaded and rejects with the `ApiError`. A create's field errors are
 * keyed as the body is (`name`, `description`, `members`, `members.0.email`).
 * Creating as any user, who becomes the owner, is planned (api/projects.md);
 * a superuser who sends `members` creates it with just those. A superuser
 * scheduling or cancelling any project's deletion is planned too.
 */
export function useProjectSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: projectKeys.all });
  const create = useMutation({
    mutationFn: (project: NewProject) =>
      request<{ data: ApiProject }>("PUT", `/api/projects/${crypto.randomUUID()}`, project),
    onSuccess: reload,
  });
  const scheduleDeletion = useMutation({ mutationFn: (id: string) => request<void>("DELETE", `/api/projects/${id}`), onSuccess: reload });
  const cancelDeletion = useMutation({ mutationFn: (id: string) => request<unknown>("DELETE", `/api/projects/${id}/scheduled_deletion`), onSuccess: reload });
  return {
    create: async (project: NewProject) => void (await create.mutateAsync(project)),
    scheduleDeletion: async (id: string) => void (await scheduleDeletion.mutateAsync(id)),
    cancelDeletion: async (id: string) => void (await cancelDeletion.mutateAsync(id)),
  };
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

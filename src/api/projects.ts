/** Projects on Lightning's API (api/projects.md, JSON:API): the API's shape, its mappers, its keys, and the hooks a route calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CredentialProjectRef } from "@/types/credentials";
import type { ProjectInput, ProjectNode } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import type { ProjectOverview } from "@/types/workflows";
import { listAll, request, statusOf } from "./client";

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
  };
}

export function projectRef(p: ApiProject): CredentialProjectRef {
  return { id: p.id, name: p.attributes.name };
}

/** `GET /api/projects`: the projects the caller is a member of, every page. */
export const listProjects = () => listAll<ApiProject>("/api/projects", "data");

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
  return { id, name: a.name, parentId: a.parent_id ?? null, color: a.color ?? null };
}

/** `GET /api/projects/:id`, and where loading it stands. A non-member gets `forbidden`. */
export function useProject(id: string): { status: ResourceStatus; project: ProjectNode | undefined } {
  const query = useQuery({
    queryKey: projectKeys.one(id),
    queryFn: () => request<{ data: ApiProject }>("GET", `/api/projects/${id}`).then((answer) => answer.data),
    select: projectNode,
  });
  return { status: statusOf(query), project: query.data };
}

/** The project ProjectGate loaded, from the same cache. Routes call the gate's useGatedProject, which passes the id. */
export function useLoadedProject(id: string): ProjectNode {
  const { project } = useProject(id);
  if (!project) throw new Error("useLoadedProject is for routes under ProjectGate, which loads the project first");
  return project;
}

const toTree = (rows: ApiProject[]) => rows.map(projectNode);
const NONE: ProjectNode[] = [];

/** Every project and sandbox you can open (the planned `depth=all`), for the project picker, and where loading them stands. */
export function useProjectTree(): { status: ResourceStatus; projects: ProjectNode[] } {
  const query = useQuery({
    queryKey: [...projectKeys.all, "tree"],
    queryFn: () => listAll<ApiProject>("/api/projects?depth=all", "data"),
    select: toTree,
  });
  return { status: statusOf(query), projects: query.data ?? NONE };
}

/** The signed-in person's projects with their counts and last activity, and where loading them stands. */
export function useProjectOverviews(): { status: ResourceStatus; projects: ProjectOverview[] } {
  const query = useQuery({
    queryKey: [...projectKeys.all, "stats"],
    queryFn: () => listAll<ApiProject>("/api/projects?include=stats", "data"),
    select: (rows) => rows.map(projectOverview),
  });
  return { status: statusOf(query), projects: query.data ?? [] };
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

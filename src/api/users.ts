/** Users on Lightning's API (api/users.md): the API's shape, its mappers, its keys, and the hooks a .query file calls. */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminProjectUser, AdminUserListRow, AdminUserSortKey } from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import type { UserRole } from "@/types/users";
import { listAll, PAGE_SIZE, pageLinks, request, sortParam, statusOf } from "./client";

/** A user as `GET /api/users` lists it. Everything after `role` is planned. */
export interface ApiUser {
  id: string;
  attributes: {
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    support_user: boolean;
    disabled: boolean;
    scheduled_deletion: string | null;
    has_activity_in_projects: boolean;
  };
}

/** Someone a project can be given to. */
export function adminProjectUser({ id, attributes: a }: ApiUser): AdminProjectUser {
  return { id, firstName: a.first_name, lastName: a.last_name, email: a.email };
}

/** A row of the users list, all but `canDelete`, which the .query adds. */
export function adminUserListRow({ id, attributes: a }: ApiUser): Omit<AdminUserListRow, "canDelete"> {
  return {
    id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    role: a.role,
    supportUser: a.support_user,
    disabled: a.disabled,
    scheduledDeletion: a.scheduled_deletion,
    hasActivityInProjects: a.has_activity_in_projects,
  };
}

export const userKeys = { all: ["users"] as const };

/**
 * Every user on the instance who isn't disabled (one scheduled for deletion
 * is), every page, loaded while `enabled`; and where loading them stands.
 * Superusers only (planned scope for a personal access token).
 */
export function useActiveUsers(enabled: boolean): { status: ResourceStatus; users: AdminProjectUser[] } {
  const query = useQuery({
    queryKey: [...userKeys.all, "active"],
    queryFn: () => listAll<ApiUser>("/api/users", "data"),
    enabled,
    select: (rows) => rows.filter((u) => !u.attributes.disabled).map(adminProjectUser),
  });
  return { status: statusOf(query), users: query.data ?? [] };
}

/** The `sort` fields the users list takes, so a query can check what the URL asks for. */
const SORT_KEYS: Record<AdminUserSortKey, true> = { first_name: true, role: true, disabled: true };
export const isAdminUserSortKey = (key: string | undefined): key is AdminUserSortKey => key !== undefined && Object.hasOwn(SORT_KEYS, key);

/**
 * One page of every user on the instance, searched and sorted by the server
 * (the planned `q` and `sort`); and where loading it stands. Superusers only.
 */
export function useAdminUsers({ q, sort, page }: { q: string; sort: SortState<AdminUserSortKey>; page: number }): {
  status: ResourceStatus;
  users: Omit<AdminUserListRow, "canDelete">[];
  page: PageLinks;
} {
  const params = new URLSearchParams({ sort: sortParam(sort), page: String(page), page_size: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  const query = useQuery({
    queryKey: [...userKeys.all, "list", String(params)],
    queryFn: () => request<{ data: ApiUser[]; links: { self: string; last: string } }>("GET", `/api/users?${params}`),
    select: (answer) => ({ users: answer.data.map(adminUserListRow), page: pageLinks(answer.links) }),
    placeholderData: keepPreviousData,
  });
  return { status: statusOf(query), users: query.data?.users ?? [], page: query.data?.page ?? { number: page, size: PAGE_SIZE, totalPages: 1 } };
}

/**
 * Schedule a user's deletion and cancel one, as a superuser (planned scope).
 * Each resolves once the lists have reloaded and rejects with the `ApiError`.
 */
export function useUserSaves() {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: userKeys.all });
  const scheduleDeletion = useMutation({ mutationFn: (id: string) => request<void>("DELETE", `/api/users/${id}`), onSuccess: reload });
  const cancelDeletion = useMutation({ mutationFn: (id: string) => request<unknown>("DELETE", `/api/users/${id}/scheduled_deletion`), onSuccess: reload });
  return {
    scheduleDeletion: async (id: string) => void (await scheduleDeletion.mutateAsync(id)),
    cancelDeletion: async (id: string) => void (await cancelDeletion.mutateAsync(id)),
  };
}

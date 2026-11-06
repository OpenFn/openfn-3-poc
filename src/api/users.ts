/** Users on Lightning's API (api/users.md): the API's shape, its mapper, its keys, and the hook a .query file calls. */
import { useQuery } from "@tanstack/react-query";
import type { AdminProjectUser } from "@/types/admin";
import type { ResourceStatus } from "@/types/resource";
import type { UserRole } from "@/types/users";
import { listAll, statusOf } from "./client";

/** A user as `GET /api/users` lists it. `disabled` is planned. */
export interface ApiUser {
  id: string;
  attributes: { email: string; first_name: string; last_name: string; role: UserRole; disabled: boolean };
}

/** Someone a project can be given to. */
export function adminProjectUser({ id, attributes: a }: ApiUser): AdminProjectUser {
  return { id, firstName: a.first_name, lastName: a.last_name, email: a.email };
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

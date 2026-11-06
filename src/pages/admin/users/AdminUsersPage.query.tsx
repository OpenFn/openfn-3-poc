import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { isAdminUserSortKey, useAdminUser, useAdminUsers, useUserSaves } from "@/api/users";
import { canDeleteUser } from "@/permissions";
import { useCurrentUser } from "@/session/session";
import type { AdminUserSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import { pageParam, useUrlParams } from "@/utils/useUrlParams";
import AdminUsersPage from "./AdminUsersPage";

/**
 * AdminUsersPage's query. /new and /:userId open the user form over the list;
 * an unknown /:userId goes to the list, as does a /:userId/delete for a user
 * who isn't on the loaded page, can't be deleted or is already scheduled.
 * Closing a modal replaces its URL, so Back doesn't open it again.
 */
export default function AdminUsersPageQuery() {
  const { userId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const { params, update, href } = useUrlParams<"q" | "sort" | "dir" | "page">();
  const sort: SortState<AdminUserSortKey> = {
    key: isAdminUserSortKey(params.sort) ? params.sort : "first_name",
    direction: params.dir === "desc" ? "desc" : "asc",
  };
  const list = useAdminUsers({ q: params.q ?? "", sort, page: pageParam(params.page) });
  const creating = pathname.endsWith("/new");
  const deleteRoute = pathname.endsWith("/delete");
  const editId = deleteRoute ? undefined : userId;
  const edited = useAdminUser(editId);
  const saves = useUserSaves();

  // Until the API says who can be deleted (docs/api-gaps.md, We clearly need these), permissions.ts stands in.
  const users = list.users.map((u) => ({ ...u, canDelete: canDeleteUser(u) }));
  const listHref = `/settings/users${search}`;
  const ready = list.status.state === "ready";
  const deleting = deleteRoute && ready ? (users.find((u) => u.id === userId && u.canDelete && !u.scheduledDeletion) ?? null) : null;
  const leave = (deleteRoute && ready && !deleting) || (editId !== undefined && edited.status.state === "notFound");

  return (
    <>
      {/* Next to the page, not instead of it: once the dialog schedules the deletion, the reloaded row is scheduled
          and this fires too, and the list should stay on screen. */}
      {leave && <Navigate to={listHref} replace />}
      <AdminUsersPage
        status={list.status}
        users={users}
        page={list.page}
        currentUserId={me.id}
        search={params.q ?? ""}
        onSearch={(q) => navigate(href({ q: q || null, page: null }), { replace: true })}
        sort={sort}
        onSort={(next) => update({ sort: next.key, dir: next.direction, page: null })}
        createHref={`/settings/users/new${search}`}
        editHref={(id) => `/settings/users/${id}${search}`}
        deleteHref={(id) => `/settings/users/${id}/delete${search}`}
        creating={creating}
        editing={editId !== undefined && !leave ? { id: editId, ...edited, ownAccount: editId === me.id } : null}
        profileHref="/profile"
        deleting={deleting}
        onClose={() => navigate(listHref, { replace: true })}
        onCreate={saves.create}
        onUpdate={saves.update}
        onScheduleDeletion={saves.scheduleDeletion}
        onCancelDeletion={saves.cancelDeletion}
      />
    </>
  );
}

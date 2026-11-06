import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { combinedStatus } from "@/api/client";
import { isAdminProjectSortKey, useAdminProjects, useProjectSaves } from "@/api/projects";
import { usePurgeDeletedAfterDays } from "@/api/session";
import { useActiveUsers } from "@/api/users";
import type { AdminProjectSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import { pageParam, useUrlParams } from "@/utils/useUrlParams";
import AdminProjectsPage from "./AdminProjectsPage";

/**
 * AdminProjectsPage's query. /:id has no edit page (the API can't edit a
 * project a superuser isn't in), so it goes to the list, as does a /:id/delete
 * for a project that isn't on the loaded page or is already scheduled.
 * Closing a modal replaces its URL, so Back doesn't open it again.
 */
export default function AdminProjectsPageQuery() {
  const { projectId } = useParams();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { params, update, href } = useUrlParams<"q" | "sort" | "dir" | "page">();
  const sort: SortState<AdminProjectSortKey> = {
    key: isAdminProjectSortKey(params.sort) ? params.sort : "name",
    direction: params.dir === "desc" ? "desc" : "asc",
  };
  const list = useAdminProjects({ q: params.q ?? "", sort, page: pageParam(params.page) });
  const purge = usePurgeDeletedAfterDays();
  const creating = pathname.endsWith("/new");
  const users = useActiveUsers(creating);
  const saves = useProjectSaves();

  const listHref = `/settings/projects${search}`;
  const status = combinedStatus(list.status, purge.status);
  const deleteRoute = pathname.endsWith("/delete");
  const deleting = deleteRoute && status.state === "ready" ? list.projects.find((p) => p.id === projectId && !p.scheduledDeletion) : undefined;
  // Rendered next to the page, not instead of it: once the dialog schedules its deletion, the reloaded row is scheduled
  // and this redirect fires too, and the list should stay on screen.
  const leave = (projectId && !deleteRoute) || (deleteRoute && status.state === "ready" && !deleting);

  return (
    <>
      {leave && <Navigate to={listHref} replace />}
      <AdminProjectsPage
        status={status}
        projects={list.projects}
        page={list.page}
        search={params.q ?? ""}
        onSearch={(q) => navigate(href({ q: q || null, page: null }), { replace: true })}
        sort={sort}
        onSort={(next) => update({ sort: next.key, dir: next.direction, page: null })}
        createHref={`/settings/projects/new${search}`}
        deleteHref={(id) => `/settings/projects/${id}/delete${search}`}
        creating={creating}
        users={users.users}
        usersStatus={users.status}
        deleting={deleting ?? null}
        gracePeriodDays={purge.days}
        onClose={() => navigate(listHref, { replace: true })}
        onCreate={saves.create}
        onScheduleDeletion={saves.scheduleDeletion}
        onCancelDeletion={saves.cancelDeletion}
      />
    </>
  );
}

import { Navigate, Outlet } from "react-router-dom";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { usePermissions } from "@/session/session";

/**
 * The parent of the superuser-only routes: every /settings/* admin page and
 * /dashboard (Lightning's `:ensure_admin`, annotations/shared/shared-admin-space.md).
 * Anyone else gets Lightning's No Access in place of the page, or, with
 * `redirect`, for a page outside the shell (/dashboard) that would leave them
 * with nowhere to go, goes to /projects as in Lightning. The API refuses them
 * too; this keeps them from seeing an admin page that can't load.
 */
export default function AdminGate({ redirect = false }: { redirect?: boolean }) {
  const { canAccessAdmin } = usePermissions();
  if (!canAccessAdmin && redirect) return <Navigate to="/projects" replace />;
  return (
    <AsyncBoundary status={{ state: canAccessAdmin ? "ready" : "forbidden" }} titleAs="h1">
      <Outlet />
    </AsyncBoundary>
  );
}

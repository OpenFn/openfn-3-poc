import { Outlet } from "react-router-dom";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { useCurrentUser } from "@/session/session";

/**
 * The parent of the superuser-only routes: every /settings/* admin page and
 * /dashboard (Lightning's `:ensure_admin`, annotations/shared/shared-admin-space.md).
 * Anyone else gets Lightning's No Access in place of the page. The API
 * refuses them too; this keeps them from seeing an admin page that can't load.
 */
export default function AdminGate() {
  const isSuperuser = useCurrentUser().role === "superuser";
  return (
    <AsyncBoundary status={{ state: isSuperuser ? "ready" : "forbidden" }} titleAs="h1">
      <Outlet />
    </AsyncBoundary>
  );
}

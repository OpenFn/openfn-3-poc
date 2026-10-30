import LiveDashboardHome from "../../components/admin/LiveDashboardHome";
// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { liveDashboard } from "../../mock-data/admin";

/**
 * Inventory view `admin-live-dashboard` (Phoenix.LiveDashboard at /dashboard).
 * Third party: a static, labelled approximation of its home page.
 */
export default function AdminLiveDashboardPage() {
  return <LiveDashboardHome data={liveDashboard} backHref="/settings/projects" />;
}

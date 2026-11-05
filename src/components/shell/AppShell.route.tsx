import { useCallback, useState } from "react";
// eslint-disable-next-line no-restricted-imports -- wiring: the layout route reads the URL and renders the route Outlet.
import { Outlet, useLocation, useParams } from "react-router-dom";
// eslint-disable-next-line no-restricted-imports -- wiring: the shell reads the signed-in user, their permissions and instance info for the sidebar.
import { useCurrentUser, useInstanceInfo, usePermissions } from "@/session/session";
import { useProjectTree } from "@/api/projects";
import Picker from "@/components/primitives/Picker";
import Layout from "./Layout";
import Sidebar, { type SidebarMenu } from "./Sidebar";
import { buildProjectPickerItems } from "./projectPickerItems";

/**
 * Lightning's logged-in layout (layouts/live.html.heex, settings.html.heex):
 * the side menu, the page, and the global project picker. Admin routes
 * (/settings/*) get the admin menu; project routes the project menu. The
 * project itself is ProjectGate's to load.
 */
export default function AppShell() {
  const { pathname } = useLocation();
  const { projectId } = useParams();
  const user = useCurrentUser();
  const { adminEmail, releaseLabel } = useInstanceInfo();
  const { canAccessAdmin } = usePermissions();
  const projects = useProjectTree();
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const menu: SidebarMenu = pathname.startsWith("/settings") ? "admin" : projectId ? "project" : "profile";

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            menu={menu}
            project={projectId ? { id: projectId } : undefined}
            user={user}
            canAccessAdmin={canAccessAdmin}
            adminEmail={adminEmail}
            releaseLabel={releaseLabel}
            collapsed={collapsed}
            onToggle={toggle}
          />
        }
      >
        <Outlet />
      </Layout>
      <Picker
        items={buildProjectPickerItems(pathname, projects)}
        currentId={projectId}
        placeholder="Search projects..."
        emptyMessage="No projects found"
        viewAllLabel="View all projects"
        viewAllHref="/projects"
        openEvent="open-project-picker"
      />
    </>
  );
}

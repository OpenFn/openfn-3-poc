import { Outlet, useLocation, useParams } from "react-router-dom";
import { useCurrentUser, useInstanceInfo, usePermissions } from "@/session/session";
import { useProject, useProjectTree } from "@/api/projects";
import Picker from "@/components/primitives/Picker";
import Layout from "@/components/primitives/Layout";
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
  const { status: projectsStatus, projects } = useProjectTree();
  // The project menu only once ProjectGate's project has loaded: not beside its Not Found or No Access.
  const { project } = useProject(projectId);

  const pickerEmpty =
    projectsStatus.state === "loading" ? "Loading projects..." : projectsStatus.state === "error" ? projectsStatus.message : "No projects found";
  const menu: SidebarMenu = pathname.startsWith("/settings") ? "admin" : project ? "project" : "profile";

  return (
    <>
      <Layout
        sidebar={({ collapsed, onToggle }) => (
          <Sidebar
            menu={menu}
            project={project}
            user={user}
            canAccessAdmin={canAccessAdmin}
            adminEmail={adminEmail}
            releaseLabel={releaseLabel}
            collapsed={collapsed}
            onToggle={onToggle}
          />
        )}
      >
        <Outlet />
      </Layout>
      <Picker
        items={buildProjectPickerItems(pathname, projects)}
        currentId={projectId}
        placeholder="Search projects..."
        emptyMessage={pickerEmpty}
        viewAllLabel="View all projects"
        viewAllHref="/projects"
        openEvent="open-project-picker"
      />
    </>
  );
}

import type { Meta, StoryObj } from "@storybook/react";
import { expect, within } from "storybook/test";
import Sidebar from "./Sidebar";
import { projects } from "@/mock-data/projects";
import { session, users } from "@/mock-data/users";
import { withAdminSidebarColours, withRouterAt } from "@/stories/decorators";

const meta: Meta<typeof Sidebar> = {
  title: "Shell/Sidebar",
  component: Sidebar,
  args: {
    collapsed: false,
    canAccessAdmin: true,
    user: session.user,
    adminEmail: session.instance.adminEmail,
    releaseLabel: session.instance.releaseLabel,
    onToggle: () => {},
  },
  decorators: [(Story) => <div className="h-[700px] flex">{<Story />}</div>],
};
export default meta;
type Story = StoryObj<typeof Sidebar>;

const projectMenu = { menu: "project", project: projects[0]! } as const;
const atHistory = withRouterAt(`/projects/${projects[0]!.id}/history`);
const inAdminColours = [withAdminSidebarColours, atHistory];

/** All projects, then the Build and Maintain groups. */
export const ProjectMenu: Story = { args: projectMenu, decorators: [atHistory] };
/** Icons only. The groups keep their names for screen readers. */
export const ProjectMenuCollapsed: Story = {
  args: { ...projectMenu, collapsed: true },
  decorators: [atHistory],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("group", { name: "Build" })).toBeInTheDocument();
    await expect(canvas.getByRole("group", { name: "Maintain" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "History" })).toHaveAttribute("aria-current", "page");
    await expect(canvas.getByRole("link", { name: "All projects" })).not.toHaveAttribute("aria-current");
  },
};
/** The project menu never shows on admin pages; this only checks the admin colours. */
export const ProjectMenuAdminColours: Story = { args: projectMenu, decorators: inAdminColours };
export const ProjectMenuAdminColoursCollapsed: Story = { args: { ...projectMenu, collapsed: true }, decorators: inAdminColours };
export const HomeMenu: Story = { args: { menu: "home" }, decorators: [withRouterAt("/profile")] };
export const AdminMenu: Story = {
  args: { menu: "admin" },
  decorators: [withRouterAt("/settings/users")],
};
/** A regular user sees Documentation, Community and Support in place of the Admin menu. */
export const RegularUser: Story = {
  args: { menu: "home", canAccessAdmin: false },
  decorators: [withRouterAt("/profile")],
};
/** Experimental features add Channels to Build, an item above the logo and a notice in the account menu. */
export const ExperimentalFeaturesOn: Story = {
  args: { ...projectMenu, user: users[3]! },
  decorators: [atHistory],
};

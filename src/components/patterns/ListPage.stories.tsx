import type { Meta, StoryObj } from "@storybook/react";
import ListPage from "./ListPage";
import Alert from "@/components/primitives/Alert";
import Button from "@/components/primitives/Button";
import ProjectsTable from "@/components/projects/ProjectsTable";
import { projectsOverviewFor } from "@/mock-data/dashboard-stats";
import { session } from "@/mock-data/users";
import { withCanvas, withRouter } from "@/stories/decorators";

const projects = projectsOverviewFor(session.user.id);

const meta: Meta<typeof ListPage> = {
  title: "Patterns/ListPage",
  component: ListPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    title: "Projects",
    showCount: true,
    actions: <Button>Create project</Button>,
    itemCount: projects.length,
    empty: { icon: "hero-folder", message: "No projects found." },
    list: <ProjectsTable projects={projects} />,
  },
};
export default meta;
type Story = StoryObj<typeof ListPage>;

export const WithRows: Story = {};
// Create stays in the header; the empty state is words only, and the count goes.
export const Empty: Story = { args: { itemCount: 0 } };
export const Loading: Story = { args: { status: { state: "loading" }, itemCount: 0 } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, itemCount: 0 } };
export const WithNotice: Story = { args: { notice: <Alert tone="info">A notice sits between the header and the list.</Alert> } };
export const WithDescription: Story = { args: { description: "Every project you're a member of." } };

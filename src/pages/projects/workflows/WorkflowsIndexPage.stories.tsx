import type { Meta, StoryObj } from "@storybook/react";
import WorkflowsIndexPage from "./WorkflowsIndexPage";
import { workflowListItemsFor } from "@/mock-data/dashboard-stats";
import { projects } from "@/mock-data/projects";
import { withCanvas, withRouter } from "@/stories/decorators";

const project = projects[0]!;

const meta: Meta<typeof WorkflowsIndexPage> = {
  title: "Pages/Projects/WorkflowsIndexPage",
  component: WorkflowsIndexPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    workflows: workflowListItemsFor(project.id),
    sort: { key: "name", direction: "asc" },
    onSort: () => {},
    canCreateWorkflow: true,
  },
};
export default meta;
type Story = StoryObj<typeof WorkflowsIndexPage>;

export const WithWorkflows: Story = {};
export const SortedByLatestRun: Story = { args: { sort: { key: "last_work_order_updated_at", direction: "desc" } } };
export const CannotCreate: Story = { args: { canCreateWorkflow: false } };
export const Empty: Story = { args: { workflows: [] } };
export const Loading: Story = { args: { status: { state: "loading" }, workflows: [] } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, workflows: [] } };

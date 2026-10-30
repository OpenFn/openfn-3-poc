import type { Meta, StoryObj } from "@storybook/react";
import WorkflowsIndexPage from "./WorkflowsIndexPage";
import { workflowStatsFor } from "../../mock-data/dashboard-stats";
import { projects } from "../../mock-data/projects";
import { projectMetricsFor } from "../../utils/history";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const stats = workflowStatsFor(project.id);
const history = `/projects/${project.id}/history`;

const meta: Meta<typeof WorkflowsIndexPage> = {
  title: "Pages/Projects/WorkflowsIndexPage",
  component: WorkflowsIndexPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    period: "last 30 days",
    stats,
    metrics: projectMetricsFor(stats),
    pendingHref: history,
    failedHref: history,
    searchTerm: "",
    sort: { key: "name", direction: "asc" },
    canCreateWorkflow: true,
    canDeleteWorkflow: true,
    lifecycle: false,
    onSearch: () => {},
    onClear: () => {},
    onToggle: async () => {},
    onDelete: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof WorkflowsIndexPage>;

export const Default: Story = {};
export const Empty: Story = { args: { stats: [], metrics: projectMetricsFor([]) } };
export const CannotCreate: Story = { args: { canCreateWorkflow: false, canDeleteWorkflow: false } };

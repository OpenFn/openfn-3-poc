import type { Meta, StoryObj } from "@storybook/react";
import ProjectMetrics from "./ProjectMetrics";
import { projectMetricsFor } from "../../utils/history";
import { workflowStatsFor } from "../../mock-data/dashboard-stats";
import { projects } from "../../mock-data/projects";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof ProjectMetrics> = {
  title: "Projects/ProjectMetrics",
  component: ProjectMetrics,
  decorators: [withRouter],
  args: {
    pendingHref: `/projects/${projects[0]!.id}/history?filters[pending]=true&filters[running]=true`,
    failedHref: `/projects/${projects[0]!.id}/history?filters[failed]=true`,
    metrics: projectMetricsFor(workflowStatsFor(projects[0]!.id)) },
};
export default meta;
type Story = StoryObj<typeof ProjectMetrics>;

export const Default: Story = {};
export const Empty: Story = { args: { metrics: projectMetricsFor([]) } };

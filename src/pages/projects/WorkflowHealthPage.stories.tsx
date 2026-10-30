import type { Meta, StoryObj } from "@storybook/react";
import WorkflowHealthPage from "./WorkflowHealthPage";
import { DEFAULT_HEALTH_DAYS, HEALTH_LOAD_ERROR } from "../../constants";
import { workflowStatsFor } from "../../mock-data/dashboard-stats";
import { projects } from "../../mock-data/projects";
import { healthFor } from "../../mock-data/workflow-health";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const { workflow } = workflowStatsFor(project.id)[0]!;
const health = healthFor(workflow.id, DEFAULT_HEALTH_DAYS);
const loading = { data: null, error: null };
const failed = { data: null, error: HEALTH_LOAD_ERROR };

const meta: Meta<typeof WorkflowHealthPage> = {
  title: "Pages/Projects/WorkflowHealthPage",
  component: WorkflowHealthPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    workflow,
    days: DEFAULT_HEALTH_DAYS,
    onDaysChange: () => {},
    outcomes: { data: health.outcomes, error: null },
    failures: { data: health.failures, error: null },
    runs: { data: health.runs, error: null },
  },
};
export default meta;
type Story = StoryObj<typeof WorkflowHealthPage>;

export const Default: Story = {};
export const Loading: Story = { args: { outcomes: loading, failures: loading, runs: loading } };
export const LoadError: Story = { args: { outcomes: failed, failures: failed, runs: failed } };

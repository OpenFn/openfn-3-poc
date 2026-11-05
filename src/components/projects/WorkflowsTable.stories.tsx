import type { Meta, StoryObj } from "@storybook/react";
import WorkflowsTable from "./WorkflowsTable";
import { workflowStatsFor } from "@/mock-data/dashboard-stats";
import { projects } from "@/mock-data/projects";
import { withRouter } from "@/stories/decorators";

const projectId = projects[0]!.id;

const meta: Meta<typeof WorkflowsTable> = {
  title: "Projects/WorkflowsTable",
  component: WorkflowsTable,
  decorators: [withRouter],
  args: {
    projectId,
    workflows: workflowStatsFor(projectId).map((s) => ({ id: s.workflow.id, name: s.workflow.name, updatedAt: s.workflow.updatedAt, lastWorkOrder: s.lastWorkOrder })),
    sort: { key: "name", direction: "asc" },
    onSort: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof WorkflowsTable>;

export const Default: Story = {};
export const SortedByLastUpdated: Story = { args: { sort: { key: "updated_at", direction: "desc" } } };

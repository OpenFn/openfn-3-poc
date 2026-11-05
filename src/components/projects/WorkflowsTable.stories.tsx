import type { Meta, StoryObj } from "@storybook/react";
import WorkflowsTable from "./WorkflowsTable";
import { workflowListItemsFor } from "@/mock-data/dashboard-stats";
import { projects } from "@/mock-data/projects";
import { withRouter } from "@/stories/decorators";

const projectId = projects[0]!.id;
const workflows = workflowListItemsFor(projectId);

const meta: Meta<typeof WorkflowsTable> = {
  title: "Projects/WorkflowsTable",
  component: WorkflowsTable,
  decorators: [withRouter],
  args: { projectId, workflows, sort: { key: "name", direction: "asc" }, onSort: () => {} },
};
export default meta;
type Story = StoryObj<typeof WorkflowsTable>;

export const Default: Story = {};
export const SortedByLastUpdated: Story = { args: { sort: { key: "updated_at", direction: "desc" } } };
/** A long name is cut off with an ellipsis, the whole name on hover. */
export const LongName: Story = {
  args: {
    workflows: [
      { ...workflows[0]!, name: "Sync patient registrations from the district health information system to the national registry" },
      ...workflows.slice(1),
    ],
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { findWorkflowGraph } from "../../mock-data/workflow";
import JobSelector from "./JobSelector";
import { withCanvas } from "../../stories/decorators";

const jobs = findWorkflowGraph("wf-openhie")!.jobs;
const meta: Meta<typeof JobSelector> = {
  title: "Workflow/JobSelector",
  component: JobSelector,
  decorators: [withCanvas("h-72 p-4")],
  args: { currentJob: jobs[0]!, jobs, onChange: () => {} },
};
export default meta;
type Story = StoryObj<typeof JobSelector>;

export const Default: Story = {};
export const NoJob: Story = { args: { currentJob: null } };
export const NoJobs: Story = { args: { currentJob: null, jobs: [] } };

import type { Meta, StoryObj } from "@storybook/react";
import { withRouter } from "../../stories/decorators";
import { findRun, stepsOf } from "../../mock-data/history";
import RunStepList from "./RunStepList";

const run = findRun("run-1")!;
const meta = {
  title: "History/RunStepList",
  component: RunStepList,
  decorators: [withRouter, (Story) => <div className="w-96">{Story()}</div>],
} satisfies Meta<typeof RunStepList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { run, steps: stepsOf(run), selectedStepId: null, projectId: "p", workflowId: "wf-openhie" },
};
export const Selected: Story = {
  args: { run, steps: stepsOf(run), selectedStepId: "step-1b", projectId: "p", workflowId: "wf-openhie" },
};
const steps = stepsOf(run);
const args = { run, selectedStepId: null, projectId: "p", workflowId: "wf-openhie" };
/** A step written before its run: carried over from an earlier run. */
export const ClonedStep: Story = {
  args: { ...args, steps: steps.map((s, i) => (i === 0 ? { ...s, insertedAt: "2026-10-01T00:00:00Z" } : s)) },
};
export const Running: Story = {
  args: { ...args, steps: steps.map((s, i) => (i === steps.length - 1 ? { ...s, exitReason: null, finishedAt: null } : s)) },
};
export const LongName: Story = {
  args: { ...args, steps: steps.map((s, i) => (i === 0 ? { ...s, jobName: "Fetch every registered patient from the district health information system" } : s)) },
};

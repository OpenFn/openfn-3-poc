import type { Meta, StoryObj } from "@storybook/react";
import { withRouter, withGrayPanel } from "../../stories/decorators";
import { findRun } from "../../mock-data/history";
import { runRow } from "../../mock-data/history-extra";
import { RunCard, StepListItem } from "./RunCard";

const meta = {
  title: "History/RunCard",
  component: RunCard,
  decorators: [withRouter, withGrayPanel],
} satisfies Meta<typeof RunCard>;
export default meta;
type Story = StoryObj<typeof meta>;

const run = (id: string, workflowId = "wf-openhie") => runRow(findRun(id)!, workflowId, "p");

const noop = () => {};
const base = { showPrevious: false, onTogglePrevious: noop, canRunWorkflow: true, dataStorageHref: "/projects/p/settings#data-storage", onCancel: noop, onRetryStep: noop };

export const SingleRun: Story = { args: { ...base, run: run("run-1"), index: 1, total: 1 } };
export const LatestOfTwo: Story = {
  args: { ...base, run: run("run-3", "wf-referrals"), index: 2, total: 2 },
};
export const FailedRun: Story = {
  args: { ...base, run: run("run-2", "wf-referrals"), index: 1, total: 2 },
};
export const Running: Story = { args: { ...base, run: run("run-4"), index: 1, total: 1 } };
export const Queued: Story = { args: { ...base, run: { ...run("run-4"), state: "available" }, index: 1, total: 1 } };

export const OneStep: Story = {
  args: { ...base, run: run("run-1"), index: 1, total: 1 },
  render: () => (
    <div role="list">
      <StepListItem step={run("run-1").steps[0]!} canRunWorkflow dataStorageHref={null} onRetry={noop} />
    </div>
  ),
};

const step = run("run-1").steps[0]!;
const stepStory = (overrides: Partial<typeof step>, canRunWorkflow = true): Story => ({
  args: { ...base, run: run("run-1"), index: 1, total: 1 },
  // A step row sits in its run's list.
  render: () => (
    <div role="list">
      <StepListItem
        step={{ ...step, ...overrides }}
        canRunWorkflow={canRunWorkflow}
        dataStorageHref={base.dataStorageHref}
        onRetry={noop}
      />
    </div>
  ),
});
export const WipedInputStep = stepStory({ inputWiped: true });
export const DeletedJob = stepStory({ jobDeleted: true });
export const ReadOnly: Story = { args: { ...base, run: run("run-1"), index: 1, total: 1, canRunWorkflow: false } };

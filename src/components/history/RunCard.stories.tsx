import type { Meta, StoryObj } from "@storybook/react";
import { withRouter, withGrayPanel } from "../../stories/decorators";
import { findRun } from "../../mock-data/history";
import { runRow } from "../../mock-data/history-extra";
import { RunCard, StepListItem } from "./RunDetails";

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
  render: () => <StepListItem step={run("run-1").steps[0]!} canRunWorkflow dataStorageHref={null} onRetry={noop} />,
};

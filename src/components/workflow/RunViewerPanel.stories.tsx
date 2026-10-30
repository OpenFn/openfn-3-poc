import type { Meta, StoryObj } from "@storybook/react";
import { dataclips, findRun, runLogs, stepsOf } from "../../mock-data/history";
import { withRouter, withWhitePanel } from "../../stories/decorators";
import RunViewerPanel from "./RunViewerPanel";

const run = findRun("run-1")!;
const steps = stepsOf(run);

const meta: Meta<typeof RunViewerPanel> = {
  title: "Workflow/RunViewerPanel",
  component: RunViewerPanel,
  decorators: [withRouter, withWhitePanel("h-175 w-130")],
  args: {
    projectId: "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa",
    run,
    startedBy: "webhook trigger",
    steps,
    logs: runLogs["run-1"]!,
    dataclips,
    selectedStepId: steps[0]!.id,
    onSelectStep: () => {},
    activeTab: "log",
  },
};
export default meta;
type Story = StoryObj<typeof RunViewerPanel>;

export const Logs: Story = {};
export const Input: Story = { args: { activeTab: "input" } };
export const Output: Story = { args: { activeTab: "output" } };
export const FailedRun: Story = {
  args: { run: findRun("run-2")!, startedBy: "cron trigger", steps: stepsOf(findRun("run-2")!), logs: runLogs["run-2"]!, selectedStepId: "step-2a" },
};
export const NoSteps: Story = { args: { steps: [], selectedStepId: null } };
export const NoStepSelected: Story = { args: { selectedStepId: null, activeTab: "input" } };

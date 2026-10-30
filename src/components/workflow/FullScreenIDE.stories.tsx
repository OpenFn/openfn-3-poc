import type { Meta, StoryObj } from "@storybook/react";
import { dataclips, findRun, runLogs, stepsOf } from "../../mock-data/history";
import { findWorkflowGraph } from "../../mock-data/workflow";
import { withRouter, withCanvas } from "../../stories/decorators";
import FullScreenIDE from "./FullScreenIDE";
import ManualRunPanel from "./ManualRunPanel";
import MiniHistory from "./MiniHistory";
import RunViewerPanel from "./RunViewerPanel";

const graph = findWorkflowGraph("wf-openhie")!;
const run = findRun("run-1")!;
const noop = () => {};

const meta: Meta<typeof FullScreenIDE> = {
  title: "Workflow/FullScreenIDE",
  component: FullScreenIDE,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter, withCanvas("h-200")],
  args: {
    jobs: graph.jobs,
    job: graph.jobs[0]!,
    onSelectJob: noop,
    onBodyChange: noop,
    onClose: noop,
    onEditAdaptor: noop,
    onChangeAdaptor: noop,
    panelState: undefined,
    onShowHistory: noop,
    onShowCreateRun: noop,
    followRunId: null,
    isRetryable: false,
    onRun: noop,
    onRetry: noop,
    onClearRun: noop,
    runTab: "log",
    onRunTabChange: noop,
  },
};
export default meta;
type Story = StoryObj<typeof FullScreenIDE>;

export const Editor: Story = {};
export const CreateRun: Story = {
  args: {
    panelState: "create-run",
    rightPanel: <ManualRunPanel mode="embedded" title="" dataclips={dataclips} onClose={noop} onRun={noop} onClosePanel={noop} />,
  },
};
export const ViewingRun: Story = {
  args: {
    panelState: "run-viewer",
    followRunId: run.id,
    isRetryable: true,
    rightPanel: (
      <RunViewerPanel
        projectId={graph.projectId}
        run={run}
        startedBy="webhook trigger"
        steps={stepsOf(run)}
        logs={runLogs["run-1"]!}
        dataclips={dataclips}
        selectedStepId="step-1a"
        onSelectStep={noop}
        activeTab="log"
      />
    ),
  },
};
export const History: Story = {
  args: {
    panelState: "history",
    rightPanel: (
      <MiniHistory
        variant="panel"
        projectId={graph.projectId}
        workflowId={graph.id}
        collapsed={false}
        onToggle={noop}
        history={[]}
        selectedRunId={null}
        onSelectRun={noop}
        onDeselectRun={noop}
        onBack={noop}
      />
    ),
  },
};
export const NoJob: Story = { args: { job: null } };

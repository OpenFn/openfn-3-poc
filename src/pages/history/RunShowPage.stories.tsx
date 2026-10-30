import type { Meta, StoryObj } from "@storybook/react";
import RunShowPage from "./RunShowPage";
import { findDataclip, findRun, findWorkOrder, stepsOf } from "../../mock-data/history";
import { finalDataclipIdOf, logsOf } from "../../mock-data/history-extra";
import { projects } from "../../mock-data/projects";
import type { RunDetail, RunStep, StepDataclip } from "../../types/history";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;

function fixture(runId: string) {
  const run = findRun(runId)!;
  const workOrder = findWorkOrder(run.workOrderId)!;
  const steps: RunStep[] = stepsOf(run).map((s) => ({ ...s, insertedAt: s.startedAt, snapshotLockVersion: 1 }));
  const detail: RunDetail = {
    id: run.id,
    workOrderId: run.workOrderId,
    state: run.state,
    startedBy: "Webhook trigger",
    insertedAt: run.insertedAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    finalDataclipId: finalDataclipIdOf(run),
    snapshot: { id: `snap-${run.id}`, lockVersion: 1, insertedAt: run.insertedAt },
  };
  return {
    runId: run.id,
    run: detail,
    workflow: { id: workOrder.workflowId, name: workOrder.workflowName, lockVersion: 1 },
    steps,
    logs: logsOf(run),
  };
}

const dataclip = (id: string | null | undefined): StepDataclip | null => {
  const dc = findDataclip(id ?? undefined);
  return dc ? { id: dc.id, wiped: dc.wiped, body: { text: JSON.stringify(dc.body, null, 2) } } : null;
};

const finished = fixture("run-1");
const step = finished.steps[0]!;

const meta: Meta<typeof RunShowPage> = {
  title: "Pages/History/RunShowPage",
  component: RunShowPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    loading: false,
    ...finished,
    selectedStepId: step.id,
    inputDataclip: dataclip(step.inputDataclipId),
    outputDataclip: dataclip(step.outputDataclipId),
    logLevel: "info",
    experimentalFeatures: false,
    canRunWorkflow: true,
    canEditDataRetention: true,
    adminContacts: [],
    onCancel: async () => {},
    onLogLevelChange: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof RunShowPage>;

export const Finished: Story = {};
export const Running: Story = { args: { ...fixture("run-4"), selectedStepId: null, inputDataclip: null, outputDataclip: null } };
export const NoStepSelected: Story = { args: { selectedStepId: null, inputDataclip: null, outputDataclip: null } };
export const Loading: Story = { args: { loading: true, run: null, workflow: null, steps: [], logs: [] } };
/** The run could not be loaded. */
export const Error: Story = { args: { run: null, workflow: null, steps: [], logs: [] } };

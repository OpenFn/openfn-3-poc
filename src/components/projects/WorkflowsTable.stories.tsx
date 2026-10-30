import type { Meta, StoryObj } from "@storybook/react";
import WorkflowsTable from "./WorkflowsTable";
import { workflowStatsFor } from "../../mock-data/dashboard-stats";
import { projects } from "../../mock-data/projects";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof WorkflowsTable> = {
  title: "Projects/WorkflowsTable",
  component: WorkflowsTable,
  decorators: [withRouter],
  args: { projectId: projects[0]!.id, stats: workflowStatsFor(projects[0]!.id), sort: { key: "name", direction: "asc" } },
};
export default meta;
type Story = StoryObj<typeof WorkflowsTable>;

export const Default: Story = {};
export const ViewerCannotDelete: Story = { args: { canDelete: false } };
export const Empty: Story = { args: { stats: [] } };
export const NoSearchMatches: Story = { args: { stats: [], searchTerm: "dhis" } };

const base = workflowStatsFor(projects[0]!.id);

/** The experimental lifecycle: Live / Draft badges in a "State" column instead of switches. */
export const Lifecycle: Story = {
  args: { lifecycle: true, stats: base.map((s, i) => ({ ...s, state: i % 2 === 0 ? "live" : "draft" })) },
};
/** The lifecycle in a sandbox: the switches stay, under "Turn on". */
export const SandboxLifecycle: Story = { args: { lifecycle: true, isSandbox: true } };
/** A workflow whose triggers are all off: its name is greyed. */
export const DisabledWorkflow: Story = {
  args: { stats: base.map((s, i) => (i === 0 ? { ...s, triggerEnabled: false, workflow: { ...s.workflow, enabled: false } } : s)) },
};
export const LongName: Story = {
  args: {
    stats: base.map((s, i) =>
      i === 0 ? { ...s, workflow: { ...s.workflow, name: "Sync patient registrations from the district health information system to the national registry" } } : s,
    ),
  },
};

/** Clicks the first row's Delete, then the confirm's Delete. */
const confirmDelete: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const doc = canvasElement.ownerDocument;
  [...canvasElement.querySelectorAll("button")].find((b) => b.textContent === "Delete")?.click();
  await new Promise((r) => setTimeout(r));
  doc.querySelector<HTMLButtonElement>('[role="dialog"] button[type="submit"]')?.click();
};
/** The delete is still out: the confirm shows pending. */
export const DeletePending: Story = { args: { onDelete: () => new Promise(() => {}) }, play: confirmDelete };
/** The host refuses: the confirm stays open with the message. */
export const DeleteFails: Story = {
  args: { onDelete: () => Promise.reject(new Error("You are not authorized to delete this workflow.")) },
  play: confirmDelete,
};

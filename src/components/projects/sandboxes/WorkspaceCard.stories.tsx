import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceCard from "./WorkspaceCard";
import { findSandboxRow, sandboxRowsUnder } from "../../../mock-data/sandboxes";
import { projects } from "../../../mock-data/projects";
import { withRouter } from "../../../stories/decorators";

const rows = sandboxRowsUnder(projects[0]!.id);

const meta: Meta<typeof WorkspaceCard> = {
  title: "Projects/Sandboxes/WorkspaceCard",
  component: WorkspaceCard,
  decorators: [withRouter],
  args: { workspace: findSandboxRow(projects[0]!.id)!, isRoot: true, isCurrent: true },
};
export default meta;
type Story = StoryObj<typeof WorkspaceCard>;

export const RootProject: Story = {};
export const Sandbox: Story = { args: { workspace: rows[0]!, isRoot: false, isCurrent: false } };
export const ScheduledForDeletion: Story = {
  args: { workspace: rows.find((r) => r.scheduledDeletion)!, isRoot: false, isCurrent: false },
};
/** The sandbox you're in: the "active" badge. */
export const Current: Story = { args: { workspace: rows[0]!, isRoot: false, isCurrent: true } };
export const LongName: Story = {
  args: {
    workspace: { ...rows[0]!, name: "fhir-mapping-for-the-national-patient-registry-integration-v2", env: "staging-for-district-rollout" },
    isRoot: false,
    isCurrent: true,
  },
};
/** Restore is greyed with the plan's reason. */
export const RestoreBlocked: Story = {
  args: {
    workspace: { ...rows.find((r) => r.scheduledDeletion)!, canCancelDeletion: true, restoreBlockedReason: "Upgrade to restore more sandboxes" },
    isRoot: false,
    isCurrent: false,
  },
};

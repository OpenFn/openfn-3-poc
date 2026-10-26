import type { Meta, StoryObj } from "@storybook/react";
import WorkspaceList from "./WorkspaceList";
import { findSandboxRow, sandboxRowsUnder } from "../../../mock-data/sandboxes";
import { projects } from "../../../mock-data/projects";
import { withRouter } from "../../../stories/decorators";

const root = findSandboxRow(projects[0]!.id)!;

const meta: Meta<typeof WorkspaceList> = {
  title: "Projects/Sandboxes/WorkspaceList",
  component: WorkspaceList,
  decorators: [withRouter],
  args: { root, sandboxes: sandboxRowsUnder(root.id), currentProjectId: root.id, newHref: `/projects/${root.id}/sandboxes/new` },
};
export default meta;
type Story = StoryObj<typeof WorkspaceList>;

export const WithSandboxes: Story = {};
export const Empty: Story = { args: { sandboxes: [] } };
export const EmptyCannotCreate: Story = {
  args: { sandboxes: [], createBlockedReason: "You are not authorized to create sandboxes in this workspace" },
};
/** A viewer who can only see a sandbox: its card is the root, with its actions. */
export const SandboxRoot: Story = {
  args: { root: sandboxRowsUnder(root.id)[0]!, rootIsSandbox: true, sandboxes: [] },
};

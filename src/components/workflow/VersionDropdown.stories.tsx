import type { Meta, StoryObj } from "@storybook/react";
import { findWorkflowGraph, snapshotsOf } from "../../mock-data/workflow";
import VersionDropdown from "./VersionDropdown";
import { withCanvas } from "../../stories/decorators";

const snapshots = snapshotsOf(findWorkflowGraph("wf-openhie")!);

const meta: Meta<typeof VersionDropdown> = {
  title: "Workflow/VersionDropdown",
  component: VersionDropdown,
  args: { snapshots, pinnedVersion: null, onVersionSelect: () => {} },
  decorators: [withCanvas("h-96 p-4")],
};
export default meta;
type Story = StoryObj<typeof VersionDropdown>;

export const Latest: Story = {};
export const PinnedOlderVersion: Story = { args: { pinnedVersion: 10 } };
export const NoVersions: Story = { args: { snapshots: [] } };

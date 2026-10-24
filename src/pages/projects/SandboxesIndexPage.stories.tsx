import type { Meta, StoryObj } from "@storybook/react";
import SandboxesIndexPage from "./SandboxesIndexPage";
import { findSandboxRow, samplePreview, sandboxRowsUnder } from "../../mock-data/sandboxes";
import { projects } from "../../mock-data/projects";
import { RequestError } from "../../utils/errors";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const root = findSandboxRow(project.id)!;
const done = async () => {};

const meta: Meta<typeof SandboxesIndexPage> = {
  title: "Pages/Projects/SandboxesIndexPage",
  component: SandboxesIndexPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project: { id: project.id, parentId: project.parentId, color: project.color },
    projectLabel: project.name,
    root,
    rootIsSandbox: false,
    sandboxes: sandboxRowsUnder(root.id),
    newHref: `/projects/${root.id}/sandboxes/new`,
    createBlockedReason: null,
    gracePeriodDays: 7,
    form: null,
    onCloseForm: () => {},
    onCreateSandbox: done,
    onUpdateSandbox: done,
    onDeleteSandbox: done,
    onCancelDeletion: done,
    onPreviewMerge: async () => samplePreview,
    onMergeSandbox: done,
  },
};
export default meta;
type Story = StoryObj<typeof SandboxesIndexPage>;

export const Default: Story = {};
export const Empty: Story = { args: { sandboxes: [] } };
export const CannotCreate: Story = {
  args: { createBlockedReason: "You are not authorized to create sandboxes in this workspace" },
};
export const CreateForm: Story = {
  args: { form: { mode: "new", parentName: project.name, parentIsSandbox: false, initialColor: "#5AA1F0" } },
};
/** Press Restore on a scheduled sandbox to see the error toast. */
export const RestoreFails: Story = {
  args: {
    onCancelDeletion: async () => {
      throw new RequestError("Sandbox not found");
    },
  },
};

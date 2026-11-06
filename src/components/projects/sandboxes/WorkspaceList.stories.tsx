import type { Meta, StoryObj } from "@storybook/react";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { withRouter } from "@/stories/decorators";
import WorkspaceList from "./WorkspaceList";

const [root, ...sandboxes] = storyWorkspace;

const meta: Meta<typeof WorkspaceList> = {
  title: "Projects/Sandboxes/WorkspaceList",
  component: WorkspaceList,
  decorators: [withRouter],
  args: {
    root: root!,
    rootIsSandbox: false,
    sandboxes,
    currentProjectId: root!.id,
    workflowsHref: (id) => `/projects/${id}/w`,
    editHref: (id) => `/projects/${root!.id}/sandboxes/${id}/edit`,
    restoreBlockedReason: null,
    restoring: () => false,
    onMerge: () => {},
    onDelete: () => {},
    onRestore: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof WorkspaceList>;

export const Default: Story = {};
/** In a sandbox: it's Selected, and main is under Active. */
export const InASandbox: Story = { args: { currentProjectId: sandboxes[0]!.id } };
export const NoOtherSandboxes: Story = { args: { sandboxes: [] } };
/** Someone who's only in a sandbox: it's the top of what they see, with no actions. */
export const OnlyInASandbox: Story = { args: { root: { ...sandboxes[0]!, parentId: null, parentName: null }, rootIsSandbox: true, sandboxes: [], currentProjectId: sandboxes[0]!.id } };

import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "storybook/test";
import { samplePreview, storyWorkspace } from "@/mock-data/sandboxes";
import { RequestError } from "@/utils/errors";
import { withCanvas, withRouter } from "@/stories/decorators";
import SandboxesIndexPage from "./SandboxesIndexPage";

const [root, ...sandboxes] = storyWorkspace;
const base = `/projects/${root!.id}/sandboxes`;
const done = async () => {};

const meta: Meta<typeof SandboxesIndexPage> = {
  title: "Pages/Projects/SandboxesIndexPage",
  component: SandboxesIndexPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project: { id: root!.id, parentId: null, color: null },
    projectLabel: root!.name,
    root: root!,
    rootIsSandbox: false,
    sandboxes,
    canCreateSandbox: true,
    sandboxLimit: null,
    gracePeriodDays: 7,
    createHref: `${base}/new`,
    workflowsHref: (id) => `/projects/${id}/w`,
    editHref: (id) => `${base}/${id}/edit`,
    creating: false,
    editingId: null,
    onClose: () => {},
    onCreate: done,
    onUpdate: done,
    onDelete: done,
    onCancelDeletion: done,
    onPreviewMerge: async (_sandbox, targetId) => ({ ...samplePreview, targetId }),
    onMerge: done,
  },
};
export default meta;
type Story = StoryObj<typeof SandboxesIndexPage>;

export const Default: Story = {};
/** A viewer: New sandbox is greyed with why, and each menu item too. */
export const Viewer: Story = {
  args: { canCreateSandbox: false, sandboxes: sandboxes.map((s) => ({ ...s, canEdit: false, canDelete: false, canMerge: false, canCancelDeletion: false })) },
};
/** The plan has no room: New sandbox and Restore say why. */
export const AtTheLimit: Story = { args: { sandboxLimit: "Your plan allows 2 sandboxes. Upgrade to make more." } };
export const NoOtherSandboxes: Story = { args: { sandboxes: [] } };
export const Long: Story = {
  args: {
    projectLabel: "openhie-project-for-the-national-health-information-exchange",
    root: { ...root!, name: "openhie-project-for-the-national-health-information-exchange-in-every-district" },
    sandboxes: sandboxes.map((s) => ({ ...s, name: `${s.name}-for-the-national-patient-registry-integration-in-every-district` })),
  },
};
export const Creating: Story = { args: { creating: true } };
export const Editing: Story = { args: { editingId: sandboxes[0]!.id } };
/** Press Save to see the server's refusal under Name. */
export const EditNameTaken: Story = {
  args: {
    editingId: sandboxes[0]!.id,
    onUpdate: async () => {
      throw new RequestError("The request body is not valid.", { fieldErrors: { name: ["Sandbox name already exists"] } });
    },
  },
};
/** Someone in only a sandbox: it's the top of what they see, with no actions. */
export const OnlyInASandbox: Story = {
  args: { project: { id: sandboxes[0]!.id, parentId: null, color: null }, root: { ...sandboxes[0]!, parentId: null, parentName: null }, rootIsSandbox: true, sandboxes: [] },
};
/** The merge dialog, opened from the sandbox's menu. */
export const Merging: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: `Actions for ${sandboxes[0]!.name}` }));
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("menuitem", { name: "Merge" }));
  },
};
export const Loading: Story = { args: { status: { state: "loading" }, root: null, sandboxes: [] } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, root: null, sandboxes: [] } };
export const Failed: Story = { args: { status: { state: "error", message: "The server could not complete that request." }, root: null, sandboxes: [] } };

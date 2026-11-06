import type { Meta, StoryObj } from "@storybook/react";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { RequestError } from "@/utils/errors";
import SandboxFormModal from "./SandboxFormModal";

const meta: Meta<typeof SandboxFormModal> = {
  title: "Projects/Sandboxes/SandboxFormModal",
  component: SandboxFormModal,
  args: { parent: { name: "openhie-project", isSandbox: false }, initialColor: "#5AA1F0", onClose: () => {}, onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof SandboxFormModal>;

export const New: Story = {};
export const NewUnderASandbox: Story = { args: { parent: { name: "fhir-mapping-v2", isSandbox: true } } };
export const Edit: Story = { args: { sandbox: storyWorkspace[1] } };
/** Save is still out: the button shows pending. */
export const Pending: Story = {
  args: { ...Edit.args, onSave: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  },
};
/** Submit a name to see the server's refusal under Name. */
export const NameTaken: Story = {
  args: {
    onSave: async () => {
      throw new RequestError("The request body is not valid.", { fieldErrors: { name: ["Sandbox name already exists"] } });
    },
  },
};
/** Submit a name to see a refusal with no field, above the form. */
export const TooDeep: Story = {
  args: {
    onSave: async () => {
      throw new RequestError("Maximum sandbox nesting depth reached");
    },
  },
};

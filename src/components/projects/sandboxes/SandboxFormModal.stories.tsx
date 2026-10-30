import type { Meta, StoryObj } from "@storybook/react";
import { RequestError } from "../../../utils/errors";
import SandboxFormModal from "./SandboxFormModal";

const meta: Meta<typeof SandboxFormModal> = {
  title: "Projects/Sandboxes/SandboxFormModal",
  component: SandboxFormModal,
  args: {
    form: { mode: "new", parentName: "openhie-project", parentIsSandbox: false, initialColor: "#5AA1F0" },
    onClose: () => {},
    onSave: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof SandboxFormModal>;

export const New: Story = {};
export const Edit: Story = {
  args: { form: { mode: "edit", sandboxId: "s1", initial: { rawName: "fhir-mapping-v2", color: "#F39B33" } } },
};
/** Save is still out: the button shows pending. */
export const Pending: Story = {
  args: { ...Edit.args, onSave: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  },
};
/** Submit to see the host's refusal on the field. */
export const DuplicateName: Story = {
  args: {
    onSave: async () => {
      throw new RequestError("Sandbox name already exists", { fieldErrors: { rawName: ["Sandbox name already exists"] } });
    },
  },
};

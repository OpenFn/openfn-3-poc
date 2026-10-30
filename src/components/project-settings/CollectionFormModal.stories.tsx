import type { Meta, StoryObj } from "@storybook/react";
import CollectionFormModal from "./CollectionFormModal";
import { RequestError } from "../../utils/errors";

const meta: Meta<typeof CollectionFormModal> = {
  title: "Project settings/CollectionFormModal",
  component: CollectionFormModal,
  args: { title: "Create Collection", onCancel: () => {}, onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof CollectionFormModal>;

export const Create: Story = {};
export const Edit: Story = { args: { title: "Edit Collection", initialName: "patient-registrations" } };

/** The host refuses the name: the message shows on the Name field and the modal stays open. */
export const NameTaken: Story = {
  args: {
    initialName: "patient-registrations",
    onSave: () => Promise.reject(new RequestError("Invalid collection", { fieldErrors: { rawName: ["has already been taken"] } })),
  },
  play: async ({ canvasElement }) => {
    canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  },
};

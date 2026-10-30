import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionModal from "./AdminCollectionModal";
import { collectionProjectOptions } from "../../mock-data/admin";
import { collections } from "../../mock-data/project-settings";
import { RequestError } from "../../utils/errors";

const meta: Meta<typeof AdminCollectionModal> = {
  title: "Admin/AdminCollectionModal",
  component: AdminCollectionModal,
  args: { projectOptions: collectionProjectOptions, onCancel: () => {}, onSave: () => Promise.resolve() },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionModal>;

export const Create: Story = {};
export const Edit: Story = { args: { collection: collections[0] } };

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** The host refuses the name: the message shows on the Name field and the modal stays open. */
export const DuplicateName: Story = {
  args: {
    ...Edit.args,
    onSave: () => Promise.reject(new RequestError("has already been taken", { fieldErrors: { rawName: ["has already been taken"] } })),
  },
  play: submit,
};

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { ...Edit.args, onSave: () => new Promise(() => {}) }, play: submit };

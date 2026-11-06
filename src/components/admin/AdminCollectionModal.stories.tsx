import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionModal from "./AdminCollectionModal";
import { collectionProjectOptions } from "@/mock-data/admin";
import { collections } from "@/mock-data/project-settings";
import { RequestError } from "@/utils/errors";

const meta: Meta<typeof AdminCollectionModal> = {
  title: "Admin/AdminCollectionModal",
  component: AdminCollectionModal,
  args: { projectOptions: collectionProjectOptions, onCancel: () => {}, onSave: () => Promise.resolve() },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionModal>;

export const Create: Story = {};
export const Edit: Story = { args: { collection: collections[0] } };
/** A long unspaced name and project label, to check they wrap rather than overflow. */
export const LongValues: Story = {
  args: {
    collection: { ...collections[0]!, name: "patient-registration-events-from-the-national-health-information-exchange-staging" },
    projectOptions: [
      ["openhie-national-health-information-exchange/fhir-mapping-and-terminology-services-staging", collections[0]!.projectId],
    ],
  },
};

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** The host refuses the name: the message shows on the Name field and the modal stays open. */
export const DuplicateName: Story = {
  args: {
    ...Edit.args,
    onSave: () => Promise.reject(new RequestError("The request body is not valid.", { fieldErrors: { name: ["A collection with this name already exists"] } })),
  },
  play: submit,
};

/** The server refuses for another reason (a plan limit): its message shows above the form. */
export const Refused: Story = {
  args: { ...Edit.args, onSave: () => Promise.reject(new RequestError("You have reached the limit of collections for this project.")) },
  play: submit,
};

/** Create pressed on a blank form: both fields say what is missing. */
export const Blank: Story = { play: submit };

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { ...Edit.args, onSave: () => new Promise(() => {}) }, play: submit };

/** The project picker couldn't load: the failure shows above the form. */
export const ProjectsFailed: Story = {
  args: { projectOptions: [], projectsStatus: { state: "error", message: "Something went wrong in Lightning." } },
};

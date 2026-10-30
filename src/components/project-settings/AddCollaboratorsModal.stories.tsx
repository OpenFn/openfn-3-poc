import type { Meta, StoryObj } from "@storybook/react";
import AddCollaboratorsModal from "./AddCollaboratorsModal";

const meta: Meta<typeof AddCollaboratorsModal> = {
  title: "Project settings/AddCollaboratorsModal",
  component: AddCollaboratorsModal,
  args: { existingEmails: ["demo@openfn.org"], onCancel: () => {}, onSave: () => {} },
};
export default meta;
type Story = StoryObj<typeof AddCollaboratorsModal>;

const tick = () => new Promise((r) => setTimeout(r));

/** Types into the nth email field the way a keystroke does, so React's onChange sees it. */
async function typeEmail(doc: Document, value: string, n = 0) {
  const input = doc.querySelectorAll<HTMLInputElement>('input[placeholder="email@example.com"]')[n]!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await tick();
}

/** Opens the nth row's role select and picks `role`. */
async function pickRole(doc: Document, role: string, n = 0) {
  doc.querySelectorAll<HTMLButtonElement>('button[data-ui="field"]')[n]!.click();
  await tick();
  [...doc.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent === role)?.click();
  await tick();
}

export const Default: Story = {};

export const InvalidEmail: Story = {
  play: async ({ canvasElement }) => typeEmail(canvasElement.ownerDocument, "not-an-email"),
};

export const AlreadyMember: Story = {
  play: async ({ canvasElement }) => typeEmail(canvasElement.ownerDocument, "demo@openfn.org"),
};

export const SeveralRows: Story = {
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await typeEmail(doc, "a.very.long.email.address.for.a.new.collaborator@a-long-partner-organisation.example.org");
    [...doc.querySelectorAll("button")].find((b) => b.textContent === "Add Additional Collaborator")?.click();
    await tick();
    await typeEmail(doc, "second@example.org", 1);
  },
};

/** The save fails: the modal stays open with the message. */
export const SaveFailed: Story = {
  args: { onSave: () => Promise.reject(new Error("The server could not complete that request.")) },
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    await typeEmail(doc, "new.person@example.org");
    await pickRole(doc, "Editor");
    doc.querySelector<HTMLButtonElement>("#save_collaborators_button")?.click();
  },
};

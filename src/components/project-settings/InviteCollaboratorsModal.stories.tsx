import type { Meta, StoryObj } from "@storybook/react";
import InviteCollaboratorsModal from "./InviteCollaboratorsModal";
import { RequestError } from "../../utils/errors";

const meta: Meta<typeof InviteCollaboratorsModal> = {
  title: "Project settings/InviteCollaboratorsModal",
  component: InviteCollaboratorsModal,
  args: { initial: [{ email: "new.person@example.org", role: "editor" }], onCancel: () => {}, onInvite: () => {} },
};
export default meta;
type Story = StoryObj<typeof InviteCollaboratorsModal>;

export const OnePerson: Story = {};
export const Several: Story = {
  args: {
    initial: [
      { email: "new.person@example.org", role: "editor" },
      { email: "another@example.org", role: "viewer" },
    ],
  },
};

const tick = () => new Promise((r) => setTimeout(r));

/** Fills in the names (typed the way a keystroke does, so React's onChange sees it) and submits. */
const fillAndInvite: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const doc = canvasElement.ownerDocument;
  for (const [placeholder, value] of [
    ["First Name", "New"],
    ["Last Name", "Person"],
  ]) {
    const input = doc.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`)!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
  }
  doc.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** The host says the email belongs to an account already: the message shows on that row. */
export const EmailTaken: Story = {
  args: {
    onInvite: () =>
      Promise.reject(new RequestError("This email is already taken", { fieldErrors: { "0.email": ["This email is already taken"] } })),
  },
  play: fillAndInvite,
};

/** The invite fails: the modal stays open with the message. */
export const Failed: Story = {
  args: { onInvite: () => Promise.reject(new Error("The server could not complete that request.")) },
  play: fillAndInvite,
};

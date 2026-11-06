import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "storybook/test";
import AdminProjectForm from "./AdminProjectForm";
import { users } from "@/mock-data/users";
import { RequestError } from "@/utils/errors";

const meta: Meta<typeof AdminProjectForm> = {
  title: "Admin/AdminProjectForm",
  component: AdminProjectForm,
  args: { users, onCancel: () => {}, onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof AdminProjectForm>;

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** A name and an owner, so Create project gets past the form's own checks to the save. */
const fillAndSubmit: Story["play"] = async ({ canvasElement }) => {
  const modal = within(canvasElement.ownerDocument.body);
  await userEvent.type(modal.getByLabelText(/^Name/), "malaria");
  await userEvent.click(modal.getByRole("button", { name: /Amy Admin's role/ }));
  await userEvent.click(await modal.findByRole("option", { name: "Owner" }));
  await userEvent.click(modal.getByRole("button", { name: "Create project" }));
};

export const New: Story = {};
export const LoadingUsers: Story = { args: { status: { state: "loading" } } };
export const UsersFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." } } };

/** Create pressed on a blank form: no name and no owner, and nothing is sent. */
export const Blank: Story = { play: submit };

/** The server's 422: two owners under Members, and a member with no account named by their email. */
export const RefusedMembers: Story = {
  args: {
    onSave: () =>
      Promise.reject(
        new RequestError("The request body is not valid.", {
          status: 422,
          fieldErrors: { members: ["A project can have only one owner."], "members.0.email": ["has no account"] },
        })
      ),
  },
  play: fillAndSubmit,
};

/** Any other refusal (here a plan limit) is a message in the modal; it stays open. */
export const Refused: Story = {
  args: { onSave: () => Promise.reject(new RequestError("Your plan has no seat for another member.")) },
  play: fillAndSubmit,
};

/** Create is still out: the button shows pending. */
export const Saving: Story = { args: { onSave: () => new Promise(() => {}) }, play: fillAndSubmit };

/** A filter that matches no one. */
export const FilterNoMatches: Story = {
  play: async ({ canvasElement }) => {
    const input = canvasElement.ownerDocument.querySelector<HTMLInputElement>('input[placeholder="Filter users"]')!;
    // Set the value the way a keystroke does, so React's onChange sees it.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "no-such-user");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  },
};

/** Long unspaced names and emails. */
export const LongValues: Story = {
  args: {
    users: [
      { id: "u-long", firstName: "Amelia", lastName: "Oluwaseun-Van-Der-Westhuizen-Montgomery", email: "amelia.oluwaseun-van-der-westhuizen-montgomery@national-health-information-exchange.example.org" },
      ...users,
    ],
  },
};

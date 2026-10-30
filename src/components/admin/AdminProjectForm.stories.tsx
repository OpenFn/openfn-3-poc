import type { Meta, StoryObj } from "@storybook/react";
import AdminProjectForm from "./AdminProjectForm";
import { projects } from "../../mock-data/projects";
import { users } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof AdminProjectForm> = {
  title: "Admin/AdminProjectForm",
  component: AdminProjectForm,
  decorators: [withRouter],
  args: { users, onSave: async () => {}, cancelHref: "/settings/projects" },
};
export default meta;
type Story = StoryObj<typeof AdminProjectForm>;

export const New: Story = {};
export const Edit: Story = { args: { project: projects[0] } };

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** Save pressed with no name and no owner: the form says why and sends nothing. */
export const NoOwner: Story = { play: submit };

/** Two owners picked: the form refuses before saving. */
export const TwoOwners: Story = {
  args: {
    project: {
      id: "p-two-owners",
      name: "openhie-project",
      members: [
        { userId: users[0]!.id, role: "owner" },
        { userId: users[1]!.id, role: "owner" },
      ],
    },
  },
};

/** The host refuses the save with a message, shown above the users table. */
export const ServerError: Story = {
  args: { ...Edit.args, onSave: () => Promise.reject(new Error("The project could not be saved.")) },
  play: submit,
};

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { ...Edit.args, onSave: () => new Promise(() => {}) }, play: submit };

/** A filter that matches no user. */
export const FilterNoMatches: Story = {
  args: { ...Edit.args },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[placeholder="Filter users..."]')!;
    // Set the value the way a keystroke does, so React's onChange sees it.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "no-such-user");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  },
};

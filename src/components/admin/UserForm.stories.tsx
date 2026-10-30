import type { Meta, StoryObj } from "@storybook/react";
import UserForm from "./UserForm";
import { users } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof UserForm> = {
  title: "Admin/UserForm",
  component: UserForm,
  decorators: [withRouter],
  args: { onSave: async () => {}, cancelHref: "/settings/users" },
};
export default meta;
type Story = StoryObj<typeof UserForm>;

export const New: Story = {};
export const EditUser: Story = { args: { user: users[1] } };
export const EditSuperuser: Story = { args: { user: users[3] } };

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

/** Support User on: the heads-up shows. */
export const SupportUserOn: Story = { args: { user: { ...users[1]!, supportUser: true } } };

/** Save pressed on an empty form: each blank field and the short password say why. */
export const Errors: Story = { play: submit };

/** The host refuses the save with a message, shown above the buttons. */
export const ServerError: Story = {
  args: { user: users[1], onSave: () => Promise.reject(new Error("The user could not be saved.")) },
  play: submit,
};

/** An account already scheduled for deletion. */
export const ScheduledDeletion: Story = {
  args: { user: { ...users[1]!, scheduledDeletion: "2026-11-30T09:00:00Z", disabled: true } },
};

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { user: users[1], onSave: () => new Promise(() => {}) }, play: submit };

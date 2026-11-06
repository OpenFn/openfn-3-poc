import type { Meta, StoryObj } from "@storybook/react";
import UserFormModal from "./UserFormModal";
import { users } from "@/mock-data/users";
import { withRouter } from "@/stories/decorators";
import { RequestError } from "@/utils/errors";

const user = users[1]!;
const ready = { state: "ready" } as const;
const edit = { id: user.id, status: ready, user, ownAccount: false };

const meta: Meta<typeof UserFormModal> = {
  title: "Admin/UserFormModal",
  component: UserFormModal,
  decorators: [withRouter],
  args: { profileHref: "/profile", onCancel: () => {}, onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof UserFormModal>;

const submit: Story["play"] = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

export const New: Story = {};
export const Edit: Story = { args: { editing: edit } };
export const Loading: Story = { args: { editing: { ...edit, status: { state: "loading" }, user: undefined } } };
export const LoadFailed: Story = { args: { editing: { ...edit, status: { state: "error", message: "Something went wrong in Lightning." }, user: undefined } } };

/** Support user ticked: the heads-up shows from the start. */
export const SupportUser: Story = { args: { editing: { ...edit, user: { ...user, supportUser: true } } } };

/** Your own account: role, support access, disabled and email are greyed, each saying why, and there's no password. */
export const OwnAccount: Story = { args: { editing: { ...edit, id: users[0]!.id, user: users[0]!, ownAccount: true } } };

/** Create pressed on a blank form: each blank field says so, and nothing is sent. */
export const Blank: Story = { play: submit };

/** The server's 422s land under their fields. */
export const RefusedFields: Story = {
  args: {
    editing: edit,
    onSave: () =>
      Promise.reject(
        new RequestError("The request body is not valid.", {
          status: 422,
          fieldErrors: { email: ["has already been taken"], password: ["should be at least 12 character(s)"], disabled: ["would leave this instance with no superuser"] },
        })
      ),
  },
  play: submit,
};

/** Any other refusal is a message in the modal; it stays open. */
export const Refused: Story = {
  args: { editing: edit, onSave: () => Promise.reject(new RequestError("You are not allowed to do that.")) },
  play: submit,
};

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { editing: edit, onSave: () => new Promise(() => {}) }, play: submit };

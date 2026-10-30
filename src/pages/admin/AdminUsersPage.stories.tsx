import type { Meta, StoryObj } from "@storybook/react";
import AdminUsersPage from "./AdminUsersPage";
import { users } from "../../mock-data/users";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};
const target = users[1]!;

const meta: Meta<typeof AdminUsersPage> = {
  title: "Pages/Admin/AdminUsersPage",
  component: AdminUsersPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    users,
    deleteUser: null,
    onCancelDeletion: done,
    onDelete: done,
    onClose: () => {},
    newUserHref: "/settings/users/new",
  },
};
export default meta;
type Story = StoryObj<typeof AdminUsersPage>;

export const List: Story = {};
export const DeleteDialog: Story = {
  args: { deleteUser: { id: target.id, email: target.email, scheduledDeletion: null, hasActivityInProjects: false } },
};
/** Deleting a scheduled account that still has project activity is refused. */
export const DeleteBlocked: Story = {
  args: {
    deleteUser: { id: target.id, email: target.email, scheduledDeletion: "2026-11-30T09:00:00Z", hasActivityInProjects: true },
  },
};

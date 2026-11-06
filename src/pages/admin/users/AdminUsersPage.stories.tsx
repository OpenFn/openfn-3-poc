import type { Meta, StoryObj } from "@storybook/react";
import AdminUsersPage from "./AdminUsersPage";
import { adminUserRows } from "@/mock-data/admin";
import { withCanvas, withRouter } from "@/stories/decorators";

const done = async () => {};
const users = adminUserRows();
const scheduled = users.map((u, i) => (i === 1 ? { ...u, disabled: true, scheduledDeletion: "2026-10-21T09:30:00Z" } : u));

const meta: Meta<typeof AdminUsersPage> = {
  title: "Pages/Admin/AdminUsersPage",
  component: AdminUsersPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    users,
    page: { number: 1, size: 25, totalPages: 1 },
    currentUserId: users[0]!.id,
    search: "",
    onSearch: () => {},
    sort: { key: "first_name", direction: "asc" },
    onSort: () => {},
    createHref: "/settings/users/new",
    editHref: (id) => `/settings/users/${id}`,
    deleteHref: (id) => `/settings/users/${id}/delete`,
    deleting: null,
    onClose: () => {},
    onScheduleDeletion: done,
    onCancelDeletion: done,
  },
};
export default meta;
type Story = StoryObj<typeof AdminUsersPage>;

export const List: Story = {};
/** A user scheduled for deletion: the date, Cancel deletion, and Delete now in the ••• menu. */
export const Scheduled: Story = { args: { users: scheduled } };
/** A search with no results: New user and the search stay in the header. */
export const NoMatches: Story = { args: { users: [], search: "malaria" } };
export const Loading: Story = { args: { status: { state: "loading" }, users: [] } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, users: [] } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, users: [] } };
/** /settings/users/:id/delete for someone who has created runs: type the email to schedule the deletion. */
export const Deleting: Story = { args: { deleting: { ...users[1]!, hasActivityInProjects: true } } };

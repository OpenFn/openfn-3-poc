import type { Meta, StoryObj } from "@storybook/react";
import AdminUsersTable from "./AdminUsersTable";
import { adminUserRows } from "@/mock-data/admin";
import { withRouter } from "@/stories/decorators";

const users = adminUserRows();
// Esther, scheduled for deletion, which disables her.
const scheduled = users.map((u, i) => (i === 1 ? { ...u, disabled: true, scheduledDeletion: "2026-10-21T09:30:00Z" } : u));

const meta: Meta<typeof AdminUsersTable> = {
  title: "Admin/AdminUsersTable",
  component: AdminUsersTable,
  decorators: [withRouter],
  args: {
    users,
    page: { number: 1, size: 25, totalPages: 1 },
    currentUserId: users[0]!.id,
    sort: { key: "first_name", direction: "asc" },
    onSort: () => {},
    editHref: (id) => `/settings/users/${id}`,
    deleteHref: (id) => `/settings/users/${id}/delete`,
    onCancelDeletion: () => {},
    cancelling: () => false,
  },
};
export default meta;
type Story = StoryObj<typeof AdminUsersTable>;

/** Superusers' Delete is disabled, with why on hover. */
export const Default: Story = {};
/** A support user, and a disabled one. */
export const SupportAndDisabled: Story = {
  args: { users: users.map((u, i) => (i === 2 ? { ...u, supportUser: true } : i === 3 ? { ...u, disabled: true } : u)) },
};
/** Scheduled: Cancel deletion, and Delete now disabled in the ••• menu. */
export const ScheduledForDeletion: Story = { args: { users: scheduled } };
/** Cancel deletion waiting on the server: only that row's button spins. */
export const Cancelling: Story = { args: { users: scheduled, cancelling: (id) => id === scheduled[1]!.id } };
/** Sorted by Role, descending, on page 2 of 3. */
export const SortedAndPaged: Story = {
  args: { sort: { key: "role", direction: "desc" }, page: { number: 2, size: 25, totalPages: 3 } },
};
/** A long name and an unspaced email wrap. */
export const LongValues: Story = {
  args: {
    users: scheduled.map((u, i) =>
      i === 1
        ? { ...u, firstName: "Amelia Oluwaseun", lastName: "Van-Der-Westhuizen-Montgomery", email: "amelia.oluwaseun.van-der-westhuizen-montgomery@ministry-of-health.example.org" }
        : u
    ),
  },
};

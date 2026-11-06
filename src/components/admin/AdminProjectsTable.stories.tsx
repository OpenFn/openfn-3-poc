import type { Meta, StoryObj } from "@storybook/react";
import AdminProjectsTable from "./AdminProjectsTable";
import { adminProjectRows } from "@/mock-data/admin";
import { withRouter } from "@/stories/decorators";

const projects = adminProjectRows();

const meta: Meta<typeof AdminProjectsTable> = {
  title: "Admin/AdminProjectsTable",
  component: AdminProjectsTable,
  decorators: [withRouter],
  args: {
    projects,
    page: { number: 1, size: 25, totalPages: 1 },
    sort: { key: "name", direction: "asc" },
    onSort: () => {},
    deleteHref: (id) => `/settings/projects/${id}/delete`,
    onCancelDeletion: () => {},
    cancelling: () => false,
  },
};
export default meta;
type Story = StoryObj<typeof AdminProjectsTable>;

export const Default: Story = {};
export const NoOwner: Story = {
  args: { projects: projects.map((p, i) => (i === 0 ? { ...p, ownerName: null, membersCount: 0 } : p)) },
};
/** Scheduled: Cancel deletion, and Delete now disabled in the ••• menu. */
export const ScheduledForDeletion: Story = {
  args: { projects: projects.map((p, i) => (i === 0 ? { ...p, scheduledDeletion: "2026-11-10T09:00:00Z" } : p)) },
};
/** Cancel deletion waiting on the server: only that row's button spins. */
export const Cancelling: Story = {
  args: { ...ScheduledForDeletion.args, cancelling: (id) => id === projects[0]!.id },
};
/** Sorted by Created, newest first, on page 2 of 3. */
export const SortedAndPaged: Story = {
  args: { sort: { key: "inserted_at", direction: "desc" }, page: { number: 2, size: 25, totalPages: 3 } },
};
/** A long unspaced name wraps, with its pill; a long owner is cut off, the whole name on hover. */
export const LongValues: Story = {
  args: {
    projects: projects.map((p, i) =>
      i === 0
        ? {
            ...p,
            name: "openhie-national-health-information-exchange-fhir-mapping-and-terminology-services",
            ownerName: "Amelia Oluwaseun-Van-Der-Westhuizen-Montgomery",
            scheduledDeletion: "2026-11-10T09:00:00Z",
          }
        : p
    ),
  },
};

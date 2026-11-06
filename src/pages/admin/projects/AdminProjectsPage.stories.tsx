import type { Meta, StoryObj } from "@storybook/react";
import AdminProjectsPage from "./AdminProjectsPage";
import { adminProjectRows } from "@/mock-data/admin";
import { users } from "@/mock-data/users";
import { withCanvas, withRouter } from "@/stories/decorators";

const done = async () => {};
const projects = adminProjectRows();
const scheduled = projects.map((p, i) => (i === 1 ? { ...p, scheduledDeletion: "2026-11-10T09:00:00Z" } : p));

const meta: Meta<typeof AdminProjectsPage> = {
  title: "Pages/Admin/AdminProjectsPage",
  component: AdminProjectsPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    projects,
    page: { number: 1, size: 25, totalPages: 1 },
    search: "",
    onSearch: () => {},
    sort: { key: "name", direction: "asc" },
    onSort: () => {},
    createHref: "/settings/projects/new",
    deleteHref: (id) => `/settings/projects/${id}/delete`,
    creating: false,
    users,
    deleting: null,
    gracePeriodDays: 7,
    onClose: () => {},
    onCreate: done,
    onScheduleDeletion: done,
    onCancelDeletion: done,
  },
};
export default meta;
type Story = StoryObj<typeof AdminProjectsPage>;

export const List: Story = {};
/** A project scheduled for deletion: its date, Cancel deletion, and Delete now in the ••• menu. */
export const Scheduled: Story = { args: { projects: scheduled } };
/** A search with no results: New project and the search stay in the header. */
export const NoMatches: Story = { args: { projects: [], search: "malaria" } };
export const Loading: Story = { args: { status: { state: "loading" }, projects: [] } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, projects: [] } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, projects: [] } };
/** /settings/projects/new. */
export const Creating: Story = { args: { creating: true } };
/** /settings/projects/:id/delete: type the name to schedule the deletion. */
export const Deleting: Story = { args: { deleting: projects[0]! } };
/** A long unspaced name wraps; a long owner is cut off, the whole name on hover. */
export const LongValues: Story = {
  args: {
    projects: scheduled.map((p, i) =>
      i === 1 ? { ...p, name: "openhie-national-health-information-exchange-fhir-mapping-and-terminology-services", ownerName: "Amelia Oluwaseun-Van-Der-Westhuizen-Montgomery" } : p
    ),
  },
};

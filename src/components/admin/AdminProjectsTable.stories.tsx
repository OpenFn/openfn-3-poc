import type { Meta, StoryObj } from "@storybook/react";
import AdminProjectsTable from "./AdminProjectsTable";
import { adminProjectRows } from "../../mock-data/admin";
import { withRouter } from "../../stories/decorators";

const projects = adminProjectRows();

const meta: Meta<typeof AdminProjectsTable> = {
  title: "Admin/AdminProjectsTable",
  component: AdminProjectsTable,
  decorators: [withRouter],
  args: { projects },
};
export default meta;
type Story = StoryObj<typeof AdminProjectsTable>;

export const Default: Story = {};
export const NoOwner: Story = {
  args: { projects: projects.map((p, i) => (i === 0 ? { ...p, ownerName: "" } : p)) },
};
export const ScheduledForDeletion: Story = {
  args: { projects: projects.map((p, i) => (i === 0 ? { ...p, scheduledDeletion: "2026-10-22T09:00:00Z" } : p)) },
};
/** Long unspaced values, to check they wrap rather than overflow. */
export const LongValues: Story = {
  args: {
    projects: projects.map((p, i) =>
      i === 0
        ? {
            ...p,
            name: "openhie-national-health-information-exchange-fhir-mapping-and-terminology-services",
            description:
              "Maps patient registrations from the district health information system to FHIR and pushes them to the national shared health record: https://shr.health.example.org/fhir/Patient/registrations",
            ownerName: "Amelia Oluwaseun-Van-Der-Westhuizen-Montgomery",
          }
        : p
    ),
  },
};

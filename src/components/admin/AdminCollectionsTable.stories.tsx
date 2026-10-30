import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionsTable from "./AdminCollectionsTable";
import { adminCollectionRows } from "../../mock-data/admin";

const collections = adminCollectionRows();

const meta: Meta<typeof AdminCollectionsTable> = {
  title: "Admin/AdminCollectionsTable",
  component: AdminCollectionsTable,
  args: { collections, onCreate: () => {}, onEdit: () => {}, onDelete: () => {} },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionsTable>;

export const Default: Story = {};
export const Empty: Story = { args: { collections: [] } };
/** Long unspaced names, to check they wrap or truncate rather than overflow. */
export const LongValues: Story = {
  args: {
    collections: collections.map((c, i) =>
      i === 0
        ? {
            ...c,
            name: "patient-registration-events-from-the-national-health-information-exchange-staging",
            projectName: "openhie-national-health-information-exchange-fhir-mapping-and-terminology-services",
          }
        : c
    ),
  },
};

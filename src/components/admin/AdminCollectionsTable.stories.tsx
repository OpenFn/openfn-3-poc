import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionsTable from "./AdminCollectionsTable";
import { adminCollectionRows } from "@/mock-data/admin";

const collections = adminCollectionRows();

const meta: Meta<typeof AdminCollectionsTable> = {
  title: "Admin/AdminCollectionsTable",
  component: AdminCollectionsTable,
  args: { collections, sort: { key: "name", direction: "asc" }, onSort: () => {}, onEdit: () => {} },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionsTable>;

export const Default: Story = {};
/** Sorted by size, largest first. */
export const SortedByStorage: Story = {
  args: {
    collections: [...collections].sort((a, b) => b.byteSizeSum - a.byteSizeSum),
    sort: { key: "byte_size_sum", direction: "desc" },
  },
};
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

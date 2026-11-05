import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionsPage from "./AdminCollectionsPage";
import { adminCollectionRows, collectionProjectOptions } from "@/mock-data/admin";
import { withCanvas, withRouter } from "@/stories/decorators";

const done = async () => {};
const collections = adminCollectionRows();

const meta: Meta<typeof AdminCollectionsPage> = {
  title: "Pages/Admin/AdminCollectionsPage",
  component: AdminCollectionsPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    collections,
    sort: { key: "name", direction: "asc" },
    onSort: () => {},
    projectOptions: collectionProjectOptions,
    onCreate: done,
    onUpdate: done,
  },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionsPage>;

export const List: Story = {};
export const Empty: Story = { args: { collections: [] } };
export const Loading: Story = { args: { status: { state: "loading" }, collections: [] } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, collections: [] } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, collections: [] } };
/** Long unspaced names wrap rather than overflow. */
export const LongValues: Story = {
  args: {
    collections: [
      {
        ...collections[0]!,
        name: "patient-registration-events-from-the-national-health-information-exchange-staging",
        projectName: "openhie-national-health-information-exchange-fhir-mapping-and-terminology-services",
      },
      ...collections.slice(1),
    ],
  },
};

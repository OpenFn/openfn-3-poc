import type { Meta, StoryObj } from "@storybook/react";
import AdminCollectionsPage from "./AdminCollectionsPage";
import { adminCollectionRows, collectionProjectOptions } from "../../mock-data/admin";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};

const meta: Meta<typeof AdminCollectionsPage> = {
  title: "Pages/Admin/AdminCollectionsPage",
  component: AdminCollectionsPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    collections: adminCollectionRows(),
    projectOptions: collectionProjectOptions,
    onCreate: done,
    onUpdate: done,
    onDelete: done,
  },
};
export default meta;
type Story = StoryObj<typeof AdminCollectionsPage>;

export const List: Story = {};
export const Empty: Story = { args: { collections: [] } };

import type { Meta, StoryObj } from "@storybook/react";
import CollectionPreviewModal from "./CollectionPreviewModal";
import { collections } from "../../mock-data/project-settings";

const meta: Meta<typeof CollectionPreviewModal> = {
  title: "Project settings/CollectionPreviewModal",
  component: CollectionPreviewModal,
  args: { name: collections[0]!.name, json: collections[0]!.previewJson, onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof CollectionPreviewModal>;

export const WithRecord: Story = {};
export const Empty: Story = { args: { name: collections[2]!.name, json: null } };

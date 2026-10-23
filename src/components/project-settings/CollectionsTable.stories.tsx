import type { Meta, StoryObj } from "@storybook/react";
import CollectionsTable from "./CollectionsTable";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { collections } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).collections;
const noop = () => {};

const meta: Meta<typeof CollectionsTable> = {
  title: "Project settings/CollectionsTable",
  component: CollectionsTable,
  args: {
    collections,
    canManage: true,
    onCreate: noop,
    onPreview: noop,
    onEdit: noop,
    onDelete: noop,
  },
};
export default meta;
type Story = StoryObj<typeof CollectionsTable>;

export const Default: Story = {};
export const Empty: Story = { args: { collections: [] } };
export const ReadOnly: Story = { args: { canManage: false } };

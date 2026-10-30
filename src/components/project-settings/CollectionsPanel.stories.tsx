import type { Meta, StoryObj } from "@storybook/react";
import CollectionsPanel from "./CollectionsPanel";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const { collections } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);
const done = async () => {};

const meta: Meta<typeof CollectionsPanel> = {
  title: "Project settings/CollectionsPanel",
  component: CollectionsPanel,
  decorators: [withRouter],
  args: {
    collections: { ...collections, canManage: true },
    sandbox: false,
    onCreate: done,
    onRename: done,
    onDelete: done,
    onPreview: async () => null,
  },
};
export default meta;
type Story = StoryObj<typeof CollectionsPanel>;

export const WithCollections: Story = {};
export const Empty: Story = { args: { collections: { collections: [], canManage: true } } };
export const Sandbox: Story = { args: { sandbox: true } };
export const ReadOnly: Story = { args: { collections: { ...collections, canManage: false } } };

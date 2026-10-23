import type { Meta, StoryObj } from "@storybook/react";
import CollaboratorsTable from "./CollaboratorsTable";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { collaborators } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).collaboration;
const noop = () => {};
const done = async () => {};

const meta: Meta<typeof CollaboratorsTable> = {
  title: "Project settings/CollaboratorsTable",
  component: CollaboratorsTable,
  args: {
    collaborators,
    canReceiveFailureAlerts: true,
    onSetFailureAlert: done,
    onSetDigest: done,
    onRemove: noop,
    onAdd: noop,
    canAdd: true,
  },
};
export default meta;
type Story = StoryObj<typeof CollaboratorsTable>;

export const Owner: Story = {};
export const Viewer: Story = {
  args: { collaborators: collaborators.map((c) => ({ ...c, removeBlockedReason: "You do not have permission to remove a user" })) },
};
export const AlertsUnavailable: Story = { args: { canReceiveFailureAlerts: false } };
export const Empty: Story = { args: { collaborators: [] } };

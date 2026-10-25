import type { Meta, StoryObj } from "@storybook/react";
import WebhookAuthMethodsTable from "./WebhookAuthMethodsTable";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { authMethods } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).webhookSecurity;
const noop = () => {};

const meta: Meta<typeof WebhookAuthMethodsTable> = {
  title: "Project settings/WebhookAuthMethodsTable",
  component: WebhookAuthMethodsTable,
  args: {
    authMethods,
    canWrite: true,
    onCreate: noop,
    onView: noop,
    onDelete: noop,
    onShowUsage: noop,
  },
};
export default meta;
type Story = StoryObj<typeof WebhookAuthMethodsTable>;

export const Default: Story = {};
export const Empty: Story = { args: { authMethods: [] } };
export const ReadOnly: Story = { args: { canWrite: false } };

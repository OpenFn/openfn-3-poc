import type { Meta, StoryObj } from "@storybook/react";
import WebhookAuthMethodDeleteModal from "./WebhookAuthMethodDeleteModal";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const { authMethods } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).webhookSecurity;

const meta: Meta<typeof WebhookAuthMethodDeleteModal> = {
  title: "Project settings/WebhookAuthMethodDeleteModal",
  component: WebhookAuthMethodDeleteModal,
  decorators: [withRouter],
  args: { authMethod: authMethods[0]!, onCancel: () => {}, onDelete: () => {} },
};
export default meta;
type Story = StoryObj<typeof WebhookAuthMethodDeleteModal>;

export const UsedByTrigger: Story = {};
export const UsedByChannel: Story = { args: { authMethod: authMethods[1]! } };
export const Unused: Story = { args: { authMethod: authMethods[2]! } };

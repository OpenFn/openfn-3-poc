import type { Meta, StoryObj } from "@storybook/react";
import WebhookAuthMethodFormModal from "./WebhookAuthMethodFormModal";
import { generateApiKey, projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { authMethods } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).webhookSecurity;

const meta: Meta<typeof WebhookAuthMethodFormModal> = {
  title: "Project settings/WebhookAuthMethodFormModal",
  component: WebhookAuthMethodFormModal,
  args: { onCancel: () => {}, onSave: async () => {}, onGenerateApiKey: async () => generateApiKey() },
};
export default meta;
type Story = StoryObj<typeof WebhookAuthMethodFormModal>;

export const ChooseType: Story = {};
export const ViewBasic: Story = { args: { authMethod: authMethods[0], onReveal: async () => "fixture-password" } };
export const ViewApiKey: Story = { args: { authMethod: authMethods[1], onReveal: async () => "fixture0000000000000000000000000000key01" } };

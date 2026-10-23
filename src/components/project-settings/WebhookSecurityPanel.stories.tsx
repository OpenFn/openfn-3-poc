import type { Meta, StoryObj } from "@storybook/react";
import WebhookSecurityPanel from "./WebhookSecurityPanel";
import { generateApiKey, projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter, withGrayPanel } from "../../stories/decorators";

const { webhookSecurity } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);
const done = async () => {};

const meta: Meta<typeof WebhookSecurityPanel> = {
  title: "Project settings/WebhookSecurityPanel",
  component: WebhookSecurityPanel,
  decorators: [withRouter, withGrayPanel],
  args: {
    webhookSecurity: { ...webhookSecurity, canWrite: true },
    parent: null,
    onCreate: done,
    onRename: done,
    onDelete: done,
    onGenerateApiKey: async () => generateApiKey(),
    onReveal: async () => "fixture-password",
  },
};
export default meta;
type Story = StoryObj<typeof WebhookSecurityPanel>;

export const WithMethods: Story = {};
export const Empty: Story = { args: { webhookSecurity: { authMethods: [], canWrite: true } } };
export const Sandbox: Story = { args: { parent: { name: "openhie-project", settingsHref: "/projects/p1/settings" } } };

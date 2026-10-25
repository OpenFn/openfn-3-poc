import type { Meta, StoryObj } from "@storybook/react";
import LinkedUsageModal from "./LinkedUsageModal";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const { authMethods } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).webhookSecurity;

const meta: Meta<typeof LinkedUsageModal> = {
  title: "Project settings/LinkedUsageModal",
  component: LinkedUsageModal,
  decorators: [withRouter],
  args: { authMethod: authMethods[0]!, onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof LinkedUsageModal>;

export const Triggers: Story = {};
export const Channels: Story = { args: { authMethod: authMethods[1]! } };

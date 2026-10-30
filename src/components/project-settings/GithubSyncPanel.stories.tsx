import type { Meta, StoryObj } from "@storybook/react";
import GithubSyncPanel from "./GithubSyncPanel";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter, withGrayPanel } from "../../stories/decorators";

const notConfigured = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).githubSync;
const connected = projectSettingsPropsFor(settingsFixtureFor(projects[1]!), session.user).githubSync;
const done = async () => {};

const meta: Meta<typeof GithubSyncPanel> = {
  title: "Project settings/GithubSyncPanel",
  component: GithubSyncPanel,
  decorators: [withRouter, withGrayPanel],
  args: {
    githubSync: { ...notConfigured, canInstall: true, canInitiateSync: true, userConnected: false },
    sandbox: false,
    onInitiateSync: done,
    onRemoveConnection: done,
  },
};
export default meta;
type Story = StoryObj<typeof GithubSyncPanel>;

export const NotConfigured: Story = {};
export const Connected: Story = { args: { githubSync: { ...connected, canInstall: true, canInitiateSync: true } } };
export const ConnectAccount: Story = {
  args: { githubSync: { ...notConfigured, enabled: true, canInstall: true, canInitiateSync: true, userConnected: false } },
};
export const ViewerConnected: Story = { args: { githubSync: { ...connected, canInstall: false, canInitiateSync: false } } };
/** The account is connected but the project has no repository yet. */
export const ConnectRepository: Story = {
  args: { githubSync: { ...notConfigured, enabled: true, canInstall: true, canInitiateSync: true, userConnected: true, connection: null } },
};
export const Sandbox: Story = { args: { ...Connected.args, sandbox: true } };

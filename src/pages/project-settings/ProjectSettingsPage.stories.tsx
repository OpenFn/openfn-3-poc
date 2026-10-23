import type { Meta, StoryObj } from "@storybook/react";
import ProjectSettingsPage from "./ProjectSettingsPage";
import { generateApiKey, projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};
const sample = (index: number) => ({
  ...projectSettingsPropsFor(settingsFixtureFor(projects[index]!), session.user),
  projectLabel: projects[index]!.name,
});

const meta: Meta<typeof ProjectSettingsPage> = {
  title: "Pages/Project settings/ProjectSettingsPage",
  component: ProjectSettingsPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    ...sample(0),
    deleting: false,
    onSaveIdentity: done,
    onSaveConcurrency: done,
    onDeleteProject: done,
    onCloseDelete: () => {},
    onCreateCollection: done,
    onRenameCollection: done,
    onDeleteCollection: done,
    onPreviewCollection: async () => null,
    onCreateWebhookAuthMethod: done,
    onRenameWebhookAuthMethod: done,
    onDeleteWebhookAuthMethod: done,
    onGenerateApiKey: async () => generateApiKey(),
    onRevealWebhookSecret: async () => "fixture-password",
    onAddCollaborators: async () => ({ toInvite: [] }),
    onInviteCollaborators: done,
    onRemoveCollaborator: done,
    onSetSupportAccess: done,
    onSetFailureAlert: done,
    onSetDigest: done,
    onSetRequiresMfa: done,
    onInitiateGithubSync: done,
    onRemoveGithubConnection: done,
    onSaveDataStorage: done,
  },
};
export default meta;
type Story = StoryObj<typeof ProjectSettingsPage>;

export const Setup: Story = {};
export const Deleting: Story = { args: { deleting: true } };
export const Sandbox: Story = { args: { ...sample(2) } };
export const SandboxDeleting: Story = { args: { ...sample(2), deleting: true } };

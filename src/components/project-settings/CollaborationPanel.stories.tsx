import type { Meta, StoryObj } from "@storybook/react";
import CollaborationPanel from "./CollaborationPanel";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withGrayPanel } from "../../stories/decorators";

const { collaboration } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);
const done = async () => {};

const meta: Meta<typeof CollaborationPanel> = {
  title: "Project settings/CollaborationPanel",
  component: CollaborationPanel,
  decorators: [withGrayPanel],
  args: {
    collaboration,
    sandbox: false,
    onAdd: async () => ({ toInvite: [] }),
    onInvite: done,
    onRemove: done,
    onSetSupportAccess: done,
    onSetFailureAlert: done,
    onSetDigest: done,
  },
};
export default meta;
type Story = StoryObj<typeof CollaborationPanel>;

export const Owner: Story = {};
export const Viewer: Story = {
  args: {
    collaboration: {
      ...collaboration,
      canEditProject: false,
      canAddProjectUser: false,
      collaborators: collaboration.collaborators.map((c) => ({ ...c, removeBlockedReason: "You do not have permission to remove a user" })),
    },
  },
};
/** The plan's collaborator limit is reached: Add is off, and says why. */
export const AtLimit: Story = {
  args: { collaboration: { ...collaboration, addBlockedReason: "You have reached the collaborator limit for your plan." } },
};
export const Sandbox: Story = { args: { sandbox: true } };
export const Empty: Story = { args: { collaboration: { ...collaboration, collaborators: [] } } };

import type { Meta, StoryObj } from "@storybook/react";
import ProfilePage from "./ProfilePage";
import { fakeMfaSetup, profilePropsFor } from "../../mock-data/profile";
import { session } from "../../mock-data/users";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};
const sample = profilePropsFor(session.user);

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/Profile/ProfilePage",
  component: ProfilePage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    ...sample,
    deleting: false,
    onSaveBasicInfo: done,
    onChangeEmail: done,
    onChangePassword: done,
    onStartMfaSetup: async () => fakeMfaSetup,
    onConfirmMfa: done,
    onDisableMfa: done,
    onDisconnectGithub: done,
    onSetExperimentalFeatures: done,
    onDeleteAccount: done,
    onCloseDelete: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};
export const MfaOn: Story = { args: { mfa: { ...sample.mfa, enabled: true } } };
export const GithubConnected: Story = { args: { github: { connectHref: "https://github.com/login/oauth/authorize?client_id=demo", status: "connected" } } };
export const DeleteModalOpen: Story = { args: { deleting: true } };
export const DeletionBlocked: Story = { args: { deleting: true, deletion: { ...sample.deletion, blocked: true } } };

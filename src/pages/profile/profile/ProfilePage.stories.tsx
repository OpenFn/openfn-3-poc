import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import ProfilePage from "./ProfilePage";
import { fakeMfaSetup, profilePropsFor } from "@/mock-data/profile";
import { session } from "@/mock-data/users";
import { withCanvas } from "@/stories/decorators";
import { withUserSettingsAt } from "@/stories/withUserSettings";

const done = async () => {};
const sample = profilePropsFor(session.user);

const meta: Meta<typeof ProfilePage> = {
  title: "Pages/Profile/ProfilePage",
  component: ProfilePage,
  // In its settings layout, which fills its parent, so give it a screen to fill.
  decorators: [withUserSettingsAt("/profile"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    ...sample,
    deleting: false,
    refused: false,
    backupCodesHref: "/profile/auth/backup_codes",
    deleteHref: `/profile/${sample.user.id}/delete`,
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
    isStepUpRequired: () => false,
    onStepUp: done,
  },
};
export default meta;
type Story = StoryObj<typeof ProfilePage>;

export const Default: Story = {};
export const MfaOn: Story = { args: { mfa: { ...sample.mfa, enabled: true } } };
export const GithubConnected: Story = { args: { github: { connectHref: "https://github.com/login/oauth/authorize?client_id=demo", status: "connected" } } };
export const DeleteModalOpen: Story = { args: { deleting: true } };
export const DeletionBlocked: Story = { args: { deleting: true, deletion: { ...sample.deletion, blocked: true } } };

const stepUpRequired = new Error("You must confirm access to do this.");

/**
 * Delete account is refused until you confirm it's you: Confirm access opens
 * over the deletion dialog. Escape closes only Confirm access, and focus goes
 * back to Delete account.
 */
export const DeleteNeedsStepUp: Story = {
  args: {
    deleting: true,
    onDeleteAccount: () => Promise.reject(stepUpRequired),
    isStepUpRequired: (error) => error === stepUpRequired,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const deletion = within(await body.findByRole("dialog", { name: "Delete user" }));
    await userEvent.type(deletion.getByLabelText(/User email/), sample.user.email);
    const deleteButton = deletion.getByRole("button", { name: "Delete account" });
    await userEvent.click(deleteButton);
    const confirm = await body.findByRole("dialog", { name: "Confirm access" });
    await expect(within(confirm).getByText("Confirm it's you to delete your account.")).toBeInTheDocument();
    await waitFor(() => expect(within(confirm).getByLabelText(/Password/)).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Confirm access" })).toBeNull());
    await expect(body.getByRole("dialog", { name: "Delete user" })).toBeInTheDocument();
    await waitFor(() => expect(deleteButton).toHaveFocus());
  },
};

/** The same for turning MFA off: Confirm access opens over Disable MFA, and Escape goes back to it. */
export const DisableMfaNeedsStepUp: Story = {
  args: {
    mfa: { ...sample.mfa, enabled: true },
    onDisableMfa: () => Promise.reject(stepUpRequired),
    isStepUpRequired: (error) => error === stepUpRequired,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: "Disable MFA" }));
    const disable = within(await body.findByRole("dialog", { name: "Disable MFA" }));
    const disableButton = disable.getByRole("button", { name: "Disable" });
    await userEvent.click(disableButton);
    const confirm = await body.findByRole("dialog", { name: "Confirm access" });
    await expect(within(confirm).getByText("Confirm it's you to turn off MFA.")).toBeInTheDocument();
    await waitFor(() => expect(within(confirm).getByLabelText(/Password/)).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog", { name: "Confirm access" })).toBeNull());
    await expect(body.getByRole("dialog", { name: "Disable MFA" })).toBeInTheDocument();
    await waitFor(() => expect(disableButton).toHaveFocus());
  },
};

/** Someone else's delete URL: Lightning's words, and no dialog. */
export const Refused: Story = { args: { refused: true } };
export const LongValues: Story = {
  args: {
    user: {
      ...sample.user,
      firstName: "Maximiliana-Alessandra Konstantinopoulou",
      lastName: "Wolfeschlegelsteinhausenbergerdorff",
      email: "maximiliana.alessandra.konstantinopoulou.wolfeschlegelsteinhausenbergerdorff@example-organisation.org",
    },
  },
};

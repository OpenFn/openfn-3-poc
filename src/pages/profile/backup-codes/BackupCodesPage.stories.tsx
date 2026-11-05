import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import BackupCodesPage from "./BackupCodesPage";
import { backupCodes } from "@/mock-data/tokens";
import { withCanvas, withRouter } from "@/stories/decorators";

const meta: Meta<typeof BackupCodesPage> = {
  title: "Pages/Profile/BackupCodesPage",
  component: BackupCodesPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    codes: backupCodes,
    mfaEnabled: true,
    onRegenerate: async () => {},
    isStepUpRequired: () => false,
    onStepUp: async () => {},
    onPrint: () => {},
    profileHref: "/profile",
  },
};
export default meta;
type Story = StoryObj<typeof BackupCodesPage>;

export const WithMfa: Story = {};
export const MfaDisabled: Story = { args: { mfaEnabled: false } };
/** The server holds the codes back until the person confirms it's them. */
export const ConfirmAccess: Story = { args: { codes: null } };
/** Closing the popup leaves a button that opens it again, and focus on it. */
export const ConfirmAccessClosed: Story = {
  args: { codes: null },
  // Something outside had focus when the popup opened, as a sidebar link does in the app; closing must not hand focus back to it.
  decorators: [
    (Story) => (
      <>
        {/* eslint-disable-next-line jsx-a11y/no-autofocus -- stands in for the link that opened the page */}
        <button autoFocus>Sidebar link</button>
        <Story />
      </>
    ),
  ],
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await body.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    const again = await body.findByRole("button", { name: "Confirm access" });
    await waitFor(() => expect(again).toHaveFocus());
  },
};
/** Regenerate refused until the person confirms it's them: the same popup, over the codes. */
export const RegenerateAsksAgain: Story = {
  args: { onRegenerate: () => Promise.reject(new Error("step up")), isStepUpRequired: () => true },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("button", { name: "Generate new backup codes" }));
    await body.findByRole("dialog", { name: "Confirm access" });
  },
};
export const Loading: Story = { args: { status: { state: "loading" }, codes: null } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, codes: null } };

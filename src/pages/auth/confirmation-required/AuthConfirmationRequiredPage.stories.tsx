import type { Meta, StoryObj } from "@storybook/react";
import AuthConfirmationRequiredPage from "./AuthConfirmationRequiredPage";
import { authMessages } from "@/constants";
import { RequestError } from "@/utils/errors";
import { withCanvas, withRouter } from "@/stories/decorators";

const meta: Meta<typeof AuthConfirmationRequiredPage> = {
  title: "Pages/Auth/AuthConfirmationRequiredPage",
  component: AuthConfirmationRequiredPage,
  // The layout fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { onResend: async () => ({ status: "sent" }) },
};
export default meta;
type Story = StoryObj<typeof AuthConfirmationRequiredPage>;

const resend: Story["play"] = async ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>("#resend-confirmation-email-button")!.click();
};

export const Default: Story = {};
export const Sent: Story = { play: resend };
/** Three resends in 15 minutes: the server refuses a fourth. */
export const Throttled: Story = {
  args: { onResend: async () => ({ status: "throttled", message: authMessages.resendThrottled }) },
  play: resend,
};
export const Failed: Story = { args: { onResend: async () => ({ status: "failed" }) }, play: resend };
/** The request never answered: the page shows why. */
export const UnexpectedError: Story = {
  args: {
    onResend: async () => {
      throw new RequestError("Connection lost. Please try again.");
    },
  },
  play: resend,
};

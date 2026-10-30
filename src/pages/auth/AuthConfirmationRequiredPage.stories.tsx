import type { Meta, StoryObj } from "@storybook/react";
import AuthConfirmationRequiredPage from "./AuthConfirmationRequiredPage";
import { unconfirmedUser } from "../../mock-data/auth";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof AuthConfirmationRequiredPage> = {
  title: "Pages/Auth/AuthConfirmationRequiredPage",
  component: AuthConfirmationRequiredPage,
  // The layout fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    email: unconfirmedUser.email,
    onResend: async () => ({ status: "sent" }),
    onChangeEmail: async ({ email }) => ({ status: "requested", email }),
    logoutTo: "/users/log_in",
  },
};
export default meta;
type Story = StoryObj<typeof AuthConfirmationRequiredPage>;

const resend: Story["play"] = async ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>("#resend-confirmation-email-button")?.click();
};

export const Default: Story = {};
export const Sent: Story = { play: resend };
export const Throttled: Story = {
  args: {
    onResend: async () => ({
      status: "throttled",
      message: "You've asked for this a few times recently; you can request another in a few minutes.",
    }),
  },
  play: resend,
};
export const Failed: Story = { args: { onResend: async () => ({ status: "failed" }) }, play: resend };
/** A long unspaced address, to check it wraps inside the panel. */
export const LongEmail: Story = {
  args: { email: "amelia.oluwaseun-van-der-westhuizen.health-informatics@ministry-of-health.example.org" },
  play: resend,
};

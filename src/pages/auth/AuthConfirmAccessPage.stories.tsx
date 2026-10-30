import type { Meta, StoryObj } from "@storybook/react";
import AuthConfirmAccessPage from "./AuthConfirmAccessPage";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof AuthConfirmAccessPage> = {
  title: "Pages/Auth/AuthConfirmAccessPage",
  component: AuthConfirmAccessPage,
  // The layout fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { user: { firstName: "Amy", lastName: "Admin", mfaEnabled: false }, onConfirm: async () => {} },
};
export default meta;
type Story = StoryObj<typeof AuthConfirmAccessPage>;

export const Password: Story = {};
/** With MFA on, the authenticator option appears. */
export const MfaEnabled: Story = { args: { user: { firstName: "Amy", lastName: "Admin", mfaEnabled: true } } };
/** The host refuses: the reason shows. */
export const Refused: Story = {
  args: { onConfirm: () => Promise.reject(new Error("Invalid password")) },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="password"]')!;
    // Set the value the way a keystroke does, so React's onChange sees it.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "wrong-password");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r));
    canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  },
};

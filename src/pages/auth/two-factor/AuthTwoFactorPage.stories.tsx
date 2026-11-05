import type { Meta, StoryObj } from "@storybook/react";
import AuthTwoFactorPage from "./AuthTwoFactorPage";
import { authMessages } from "@/constants";
import { withCanvas, withRouterAt } from "@/stories/decorators";

const meta: Meta<typeof AuthTwoFactorPage> = {
  title: "Pages/Auth/AuthTwoFactorPage",
  component: AuthTwoFactorPage,
  decorators: [withRouterAt("/users/two-factor"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { method: "totp", otherMethodHref: "/users/two-factor?authentication_type=backup_code", onVerify: async () => {} },
};
export default meta;
type Story = StoryObj<typeof AuthTwoFactorPage>;

export const AuthenticatorCode: Story = {};
export const BackupCode: Story = { args: { method: "backup_code", otherMethodHref: "/users/two-factor?authentication_type=totp" } };
/** The host refuses the code: Lightning's flash shows at the top of the panel. */
export const InvalidCode: Story = {
  args: { onVerify: () => Promise.reject(new Error(authMessages.invalidTwoFactorCode)) },
  play: ({ canvasElement }) => enterCode(canvasElement),
};
/** Checking the code: the button shows it's working. */
export const Pending: Story = { args: { onVerify: () => new Promise(() => {}) }, play: ({ canvasElement }) => enterCode(canvasElement) };
/** Submitted empty. */
export const Blank: Story = {
  play: ({ canvasElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click(),
};

async function enterCode(canvasElement: HTMLElement) {
  const input = canvasElement.querySelector<HTMLInputElement>("#user_code")!;
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "000000");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r));
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
}

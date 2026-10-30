import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "storybook/test";
import MfaCard from "./MfaCard";
import { fakeMfaSetup } from "../../mock-data/profile";
import { withRouter } from "../../stories/decorators";
import { RequestError } from "../../utils/errors";

const meta: Meta<typeof MfaCard> = {
  title: "Profile/MfaCard",
  component: MfaCard,
  decorators: [withRouter],
  args: {
    mfa: { enabled: false, backupCodesHref: "/profile/auth/backup_codes" },
    onStartSetup: async () => fakeMfaSetup,
    onConfirm: async () => {},
    onDisable: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof MfaCard>;

export const Disabled: Story = {};
export const Enabled: Story = { args: { mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } } };

const enabled = { mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } };
const settle = () => new Promise((r) => setTimeout(r, 50));
const pressAction: Story["play"] = async ({ canvasElement }) => {
  canvasElement.querySelector<HTMLButtonElement>("#mfa-action")?.click();
  await settle();
};
/** Opens setup, types a code and presses Save. */
const submitCode: Story["play"] = async (ctx) => {
  await pressAction(ctx);
  const doc = ctx.canvasElement.ownerDocument;
  const input = doc.querySelector<HTMLInputElement>('#set_totp_form input[placeholder="XXXXXX"]')!;
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "123456");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  doc.querySelector<HTMLButtonElement>('#set_totp_form button[type="submit"]')?.click();
};

/** "Set up MFA" pressed: the setup form with the QR code. */
export const SetupOpen: Story = { play: pressAction };

/** The host refuses the code: the message shows on the field. */
export const CodeError: Story = {
  args: { onConfirm: () => Promise.reject(new RequestError("invalid", { fieldErrors: { code: ["Invalid code"] } })) },
  play: submitCode,
};

/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { onConfirm: () => new Promise(() => {}) }, play: submitCode };

/** "this secret key" pressed: the secret for manual setup. */
export const SecretShown: Story = {
  play: async (ctx) => {
    await pressAction(ctx);
    await userEvent.click(within(ctx.canvasElement).getByText("this secret key"));
  },
};

/** "Disable MFA" pressed: the confirm dialog. */
export const ConfirmDisable: Story = { args: enabled, play: pressAction };

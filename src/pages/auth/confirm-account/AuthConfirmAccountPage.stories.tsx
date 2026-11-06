import type { Meta, StoryObj } from "@storybook/react";
import AuthConfirmAccountPage from "./AuthConfirmAccountPage";
import { authMessages } from "@/constants";
import { withCanvas, withRouterAt } from "@/stories/decorators";

const meta: Meta<typeof AuthConfirmAccountPage> = {
  title: "Pages/Auth/AuthConfirmAccountPage",
  component: AuthConfirmAccountPage,
  decorators: [withRouterAt("/users/confirm"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { step: "resend", onResend: async () => {}, onConfirm: async () => {}, allowSignup: false },
};
export default meta;
type Story = StoryObj<typeof AuthConfirmAccountPage>;

const submit = ({ canvasElement }: { canvasElement: HTMLElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
const sendEmail = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const input = canvasElement.querySelector<HTMLInputElement>("#user_email")!;
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "una@openfn.org");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r));
  submit({ canvasElement });
};

/** /users/confirm: asking for the email again. */
export const Resend: Story = {};
/** Sending: the button shows it's working. */
export const ResendPending: Story = { args: { onResend: () => new Promise(() => {}) }, play: sendEmail };
/** Submitted empty: the email says why. */
export const ResendBlank: Story = { play: submit };
/** The instance lets people register. */
export const SignupAllowed: Story = { args: { allowSignup: true } };
/** The instance's sign-in options didn't load, so Register may be missing. */
export const OptionsFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." } } };

/** /users/confirm/:token: one button, no links. */
export const Confirm: Story = { args: { step: "confirm" } };
/** Confirming: the button shows it's working. */
export const ConfirmPending: Story = { args: { step: "confirm", onConfirm: () => new Promise(() => {}) }, play: submit };
/** A used, expired or someone else's link: Lightning's words in the card. */
export const LinkInvalid: Story = {
  args: { step: "confirm", onConfirm: () => Promise.reject(new Error(authMessages.confirmInvalid)) },
  play: submit,
};

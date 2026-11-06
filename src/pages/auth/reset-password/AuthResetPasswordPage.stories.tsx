import type { Meta, StoryObj } from "@storybook/react";
import AuthResetPasswordPage from "./AuthResetPasswordPage";
import { authMessages } from "@/constants";
import { withCanvas, withRouterAt } from "@/stories/decorators";
import { RequestError } from "@/utils/errors";

const meta: Meta<typeof AuthResetPasswordPage> = {
  title: "Pages/Auth/AuthResetPasswordPage",
  component: AuthResetPasswordPage,
  decorators: [withRouterAt("/users/reset_password"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { step: "request", onRequest: async () => {}, onReset: async () => {}, allowSignup: false, flash: null },
};
export default meta;
type Story = StoryObj<typeof AuthResetPasswordPage>;

const setValue = (input: HTMLInputElement, value: string) => {
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const fillAndSubmit = async (canvasElement: HTMLElement, values: Record<string, string>) => {
  for (const [id, value] of Object.entries(values)) setValue(canvasElement.querySelector<HTMLInputElement>(`#${id}`)!, value);
  await new Promise((r) => setTimeout(r));
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};
const submit = ({ canvasElement }: { canvasElement: HTMLElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();

/** /users/reset_password: asking for a link. */
export const Request: Story = {};
/** Back from a dead link: the message the redirect carried shows at the top of the card. */
export const LinkExpired: Story = { args: { flash: { tone: "info", message: authMessages.resetInvalid } } };
/** Sending the email: the button shows it's working. */
export const RequestPending: Story = {
  args: { onRequest: () => new Promise(() => {}) },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement, { user_email: "amy@openfn.org" }),
};
/** Submitted empty: the email says why. */
export const RequestBlank: Story = { play: submit };
/** The instance's sign-in options didn't load, so Register may be missing. */
export const OptionsFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." } } };
/** The instance lets people register. */
export const SignupAllowed: Story = { args: { allowSignup: true } };

/** /users/reset_password/:token: setting a new password. */
export const Reset: Story = { args: { step: "reset" } };
/** Submitted empty: the new password says why. */
export const ResetBlank: Story = { args: { step: "reset" }, play: submit };
/** The confirmation doesn't match. */
export const ResetMismatch: Story = {
  args: { step: "reset" },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement, { user_password: "a-long-new-password", user_password_confirmation: "something-else" }),
};
/** The server won't take the password: its words show under the field. */
export const ResetTooShort: Story = {
  args: {
    step: "reset",
    onReset: () =>
      Promise.reject(new RequestError("The request body is not valid.", { fieldErrors: { password: ["should be at least 12 character(s)"] } })),
  },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement, { user_password: "short", user_password_confirmation: "short" }),
};
/** A failure the page doesn't expect: the server's message shows at the top of the card. */
export const ResetFailed: Story = {
  args: { step: "reset", onReset: () => Promise.reject(new Error("Something went wrong in Lightning.")) },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement, { user_password: "a-long-new-password", user_password_confirmation: "a-long-new-password" }),
};
/** The instance lets people register: Register sits under the divider. */
export const ResetSignupAllowed: Story = { args: { step: "reset", allowSignup: true } };

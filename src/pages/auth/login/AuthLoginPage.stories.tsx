import type { Meta, StoryObj } from "@storybook/react";
import AuthLoginPage from "./AuthLoginPage";
import { authMessages } from "@/constants";
import { exampleSsoProvider } from "@/mock-data/auth";
import { withCanvas, withRouterAt } from "@/stories/decorators";

const meta: Meta<typeof AuthLoginPage> = {
  title: "Pages/Auth/AuthLoginPage",
  component: AuthLoginPage,
  decorators: [withRouterAt("/users/log_in"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { onLogIn: async () => {}, allowSignup: false, ssoProvider: null, flash: null },
};
export default meta;
type Story = StoryObj<typeof AuthLoginPage>;

const fillAndSubmit = async (canvasElement: HTMLElement) => {
  setValue(canvasElement.querySelector<HTMLInputElement>("#user_email")!, "amy@openfn.org");
  setValue(canvasElement.querySelector<HTMLInputElement>("#user_password")!, "wrong-password");
  await new Promise((r) => setTimeout(r));
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

const setValue = (input: HTMLInputElement, value: string) => {
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

export const Default: Story = {};
/** Arrived from logging out: the message the redirect carried shows at the top of the card. */
export const AfterLoggingOut: Story = { args: { flash: { tone: "info", message: authMessages.loggedOut } } };
/** The host refuses the email and password: Lightning's flash shows at the top of the card. */
export const InvalidCredentials: Story = {
  args: { onLogIn: () => Promise.reject(new Error(authMessages.invalidLogin)) },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement),
};
/** Signing in: the button shows it's working. */
export const Pending: Story = {
  args: { onLogIn: () => new Promise(() => {}) },
  play: ({ canvasElement }) => fillAndSubmit(canvasElement),
};
/** Submitted empty: both fields say why. */
export const Blank: Story = {
  play: ({ canvasElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click(),
};
/** The instance's sign-in options didn't load, so Register or the provider may be missing. */
export const OptionsFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." } } };
/** The instance has an external sign-in provider. */
export const WithSso: Story = { args: { ssoProvider: exampleSsoProvider } };
/** The instance lets people register. */
export const SignupAllowed: Story = { args: { allowSignup: true } };

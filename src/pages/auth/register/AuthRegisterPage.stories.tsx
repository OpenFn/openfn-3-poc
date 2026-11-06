import type { Meta, StoryObj } from "@storybook/react";
import AuthRegisterPage from "./AuthRegisterPage";
import { withCanvas, withRouter } from "@/stories/decorators";
import { RequestError } from "@/utils/errors";

const meta: Meta<typeof AuthRegisterPage> = {
  title: "Pages/Auth/AuthRegisterPage",
  component: AuthRegisterPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { onRegister: async () => {} },
};
export default meta;
type Story = StoryObj<typeof AuthRegisterPage>;

const setValue = (input: HTMLInputElement, value: string) => {
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const fillAndRegister = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const values = { user_first_name: "Eddie", user_last_name: "Editor", user_email: "editor@openfn.org", user_password: "welcome12345" };
  for (const [id, value] of Object.entries(values)) setValue(canvasElement.querySelector<HTMLInputElement>(`#${id}`)!, value);
  canvasElement.querySelector<HTMLInputElement>("#user_terms_accepted")!.click();
  await new Promise((r) => setTimeout(r));
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
};

export const Default: Story = {};
/** Submitted empty: each field and the terms box say why. */
export const Errors: Story = {
  play: ({ canvasElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')!.click(),
};
/** The server says the email is taken: its words show under Email. */
export const Taken: Story = {
  args: { onRegister: () => Promise.reject(new RequestError("The request body is not valid.", { fieldErrors: { email: ["has already been taken"] } })) },
  play: fillAndRegister,
};
/** A failure the page doesn't expect: the server's message shows by the form. */
export const ServerError: Story = {
  args: { onRegister: () => Promise.reject(new Error("Something went wrong in Lightning.")) },
  play: fillAndRegister,
};

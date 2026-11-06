import type { Meta, StoryObj } from "@storybook/react";
import FirstSetupPage from "./FirstSetupPage";
import FirstSetupShell from "@/components/auth/FirstSetupShell";
import { withRouter } from "@/stories/decorators";
import { RequestError } from "@/utils/errors";

const meta: Meta<typeof FirstSetupPage> = {
  title: "Pages/Auth/FirstSetupPage",
  component: FirstSetupPage,
  // The host draws the empty side menu around it, as on a fresh install.
  decorators: [
    (Story) => (
      <FirstSetupShell releaseLabel="v2.19.1">
        <Story />
      </FirstSetupShell>
    ),
    withRouter,
  ],
  parameters: { layout: "fullscreen" },
  args: { onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof FirstSetupPage>;

const setValue = (input: HTMLInputElement, value: string) => {
  // Set the value the way a keystroke does, so React's onChange sees it.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const fillAndSave = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const values = { first_name: "Amy", last_name: "Admin", email: "demo@openfn.org", password: "welcome12345", password_confirmation: "welcome12345" };
  for (const [id, value] of Object.entries(values)) setValue(canvasElement.querySelector<HTMLInputElement>(`#${id}`)!, value);
  await new Promise((r) => setTimeout(r));
  canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};

export const Default: Story = {};
/** Submitted empty: each field says why. */
export const Errors: Story = {
  play: ({ canvasElement }) => canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click(),
};
/** The server says the email is taken: its words show under Email. */
export const Taken: Story = {
  args: { onSave: () => Promise.reject(new RequestError("The request body is not valid.", { fieldErrors: { email: ["has already been taken"] } })) },
  play: fillAndSave,
};
/** A failure the page doesn't expect: the server's message shows by the form. */
export const ServerError: Story = {
  args: { onSave: () => Promise.reject(new Error("Something went wrong in Lightning.")) },
  play: fillAndSave,
};

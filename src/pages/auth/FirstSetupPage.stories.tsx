import type { Meta, StoryObj } from "@storybook/react";
import FirstSetupPage from "./FirstSetupPage";
import FirstSetupShell from "../../components/auth/FirstSetupShell";
import { withRouter } from "../../stories/decorators";

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

export const Default: Story = {};
/** Submitted empty: each field says why. */
export const Errors: Story = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import Alert from "./Alert";

const meta: Meta<typeof Alert> = {
  title: "Primitives/Alert",
  component: Alert,
  args: {
    tone: "warning",
    header: "Heads Up!",
    children: "Disabling parallel run execution may significantly reduce the overall throughput of your project.",
  },
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Warning: Story = {};
export const Info: Story = {
  args: {
    tone: "info",
    header: undefined,
    children: "Changes you make here only apply to this sandbox and do not sync to the parent project on merge.",
  },
};
export const Success: Story = { args: { tone: "success", header: undefined, children: "Changes you make here will sync to the parent project on merge." } };
export const Danger: Story = { args: { tone: "danger", header: "1 channel will accept unauthenticated requests" } };
export const LongTitle: Story = {
  args: {
    tone: "danger",
    header: "3 channels in Kenya MoH community health referrals to DHIS2 aggregate sync (sandbox) will accept unauthenticated requests",
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import Alert from "./Alert";
import Button from "./Button";
import { Stack } from "./Stack";

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

/** Each press shows the result again under a new key. */
export const ShownByAnAction: Story = {
  render: function ShownByAnAction() {
    const [presses, setPresses] = useState(0);
    return (
      <Stack>
        <Button onClick={() => setPresses((n) => n + 1)}>Delete credential</Button>
        {presses > 0 && (
          <Alert key={presses} tone="success">
            Credential scheduled for deletion
          </Alert>
        )}
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("button")?.click();
  },
};

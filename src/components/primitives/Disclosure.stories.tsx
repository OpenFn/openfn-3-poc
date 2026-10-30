import type { Meta, StoryObj } from "@storybook/react";
import Disclosure from "./Disclosure";
import Pill from "./Pill";

const meta: Meta<typeof Disclosure> = {
  title: "Primitives/Disclosure",
  component: Disclosure,
  args: {
    title: "Request",
    children: <p className="text-sm text-muted">POST /channels/shr with 2 headers and a 1.2 KB JSON body.</p>,
  },
};
export default meta;
type Story = StoryObj<typeof Disclosure>;

export const Card: Story = { args: { titleRight: <Pill tone="success">200</Pill> } };
export const StartsClosed: Story = { args: { defaultOpen: false } };
export const Section: Story = {
  args: { variant: "section", title: "Headers" },
  decorators: [(Story) => <div className="rounded-lg bg-surface ring-1 ring-subtle">{<Story />}</div>],
};
export const Inline: Story = {
  args: { variant: "inline", title: "Advanced", note: "optional", defaultOpen: false },
};

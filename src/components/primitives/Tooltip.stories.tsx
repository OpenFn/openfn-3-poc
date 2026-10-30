import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";
import Tooltip from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  args: { content: "Save changes", children: <Button>Save</Button> },
  decorators: [(Story) => <div className="p-12"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {};
export const Top: Story = { args: { side: "top" } };
/** A disabled control; a wrapper takes its hover and swallows the click. */
export const Disabled: Story = {
  args: { disabled: true, content: "Type the name to enable", children: <Button disabled>Delete</Button> },
};
/** Click to copy; the tooltip says "Copied!" for 1.5 seconds. */
export const Copy: Story = {
  args: {
    side: "top",
    copy: "2026-10-14 08:30:07 UTC",
    content: (
      <>
        2026-10-14 08:30:07 UTC
        <span className="block text-xs text-faint">Click to copy timestamp</span>
      </>
    ),
    children: <span className="cursor-pointer">today at 8:30:07 AM</span>,
  },
};
/** `interactive`: the pointer can move onto the tooltip to click its link. */
export const Interactive: Story = {
  args: {
    interactive: true,
    content: (
      <>
        Only project owners and admins can do this.{" "}
        <a href="https://docs.openfn.org" className="underline">
          Learn more
        </a>
      </>
    ),
  },
};
export const LongContent: Story = {
  args: {
    content:
      "This workflow has unsaved changes. Save them before running a step, or the run will use the last saved version of every job.",
  },
};

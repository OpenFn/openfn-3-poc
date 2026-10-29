import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";
import { withRouter, withWhitePanel } from "../stories/decorators";

const meta: Meta<typeof Button> = {
  title: "Shared/Button",
  component: Button,
  decorators: [withRouter],
  args: { children: "Save" },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary", children: "Cancel" } };
export const Danger: Story = { args: { tone: "danger", children: "Delete" } };
export const Success: Story = { args: { tone: "success", children: "Connect" } };
export const Disabled: Story = { args: { disabled: true, tooltip: "You don't have permission" } };
export const Pending: Story = { args: { pending: true, children: "Saving" } };
export const WithIcon: Story = { args: { icon: "hero-plus", children: "New project" } };
export const WithIconRight: Story = { args: { icon: "hero-arrow-right", iconPosition: "right", children: "Build it" } };
/** Plain text sits on white: on the grey page it falls below 4.5:1. */
export const Plain: Story = { args: { variant: "plain", children: "Show more" }, decorators: [withWhitePanel()] };
export const ExtraSmall: Story = { args: { size: "xs", children: "Edit" } };
export const Small: Story = { args: { size: "sm", children: "Run" } };
export const Large: Story = { args: { size: "lg", children: "Create project" } };
export const AsLink: Story = { args: { to: "/projects", children: "Projects" } };
export const AsExternalLink: Story = { args: { href: "https://docs.openfn.org", children: "Docs" } };

/** Every look, enabled and disabled (filled buttons at their 300 shade, secondary grey, plain faded). */
export const AllLooks: Story = {
  decorators: [withWhitePanel("w-auto")],
  render: () => (
    <div className="grid grid-cols-2 gap-3 justify-items-start">
      {[false, true].map((disabled) => (
        <div key={String(disabled)} className="flex gap-2">
          <Button disabled={disabled}>Save</Button>
          <Button variant="secondary" disabled={disabled}>Cancel</Button>
          <Button tone="danger" disabled={disabled}>Delete</Button>
          <Button tone="success" disabled={disabled}>Connect</Button>
          <Button variant="plain" disabled={disabled}>More</Button>
          <Button variant="plain" tone="danger" disabled={disabled}>Remove</Button>
        </div>
      ))}
    </div>
  ),
};

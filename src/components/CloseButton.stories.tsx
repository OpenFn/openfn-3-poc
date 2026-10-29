import type { Meta, StoryObj } from "@storybook/react";
import CloseButton from "./CloseButton";

const meta: Meta<typeof CloseButton> = {
  title: "Shared/CloseButton",
  component: CloseButton,
};
export default meta;
type Story = StoryObj<typeof CloseButton>;

export const Default: Story = {};
export const ExtraSmall: Story = { args: { size: "xs" } };
export const WithLabel: Story = { args: { label: "Close panel" } };

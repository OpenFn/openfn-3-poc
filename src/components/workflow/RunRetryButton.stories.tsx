import type { Meta, StoryObj } from "@storybook/react";
import RunRetryButton from "./RunRetryButton";
import { withSidePanel } from "../../stories/decorators";

const meta: Meta<typeof RunRetryButton> = {
  title: "Workflow/RunRetryButton",
  component: RunRetryButton,
  decorators: [withSidePanel("h-32 p-4")],
  args: { isRetryable: false, onRun: () => {}, onRetry: () => {} },
};
export default meta;
type Story = StoryObj<typeof RunRetryButton>;

export const Run: Story = {};
export const Retry: Story = { args: { isRetryable: true } };
export const Disabled: Story = { args: { disabled: true } };

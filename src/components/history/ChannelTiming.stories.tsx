import type { Meta, StoryObj } from "@storybook/react";
import ChannelTiming from "./ChannelTiming";

const meta = { title: "History/ChannelTiming", component: ChannelTiming } satisfies Meta<typeof ChannelTiming>;
export default meta;
type Story = StoryObj<typeof meta>;

const none = { latencyUs: null, queueUs: null, connectUs: null, requestSendUs: null, ttfbUs: null, responseDurationUs: null };

export const FullPhases: Story = {
  args: { timing: { latencyUs: 284_000, queueUs: 1_200, connectUs: 38_400, requestSendUs: 2_100, ttfbUs: 251_000, responseDurationUs: 31_000 } },
};
export const TtfbOnly: Story = { args: { timing: { ...none, latencyUs: 131_000, ttfbUs: 118_500 } } };
export const TotalOnly: Story = { args: { timing: { ...none, latencyUs: 5_000_000 } } };

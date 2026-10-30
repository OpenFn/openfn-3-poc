import type { Meta, StoryObj } from "@storybook/react";
import HistoryTabs from "./HistoryTabs";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof HistoryTabs> = {
  title: "History/HistoryTabs",
  component: HistoryTabs,
  decorators: [withRouter],
  args: { workOrdersHref: "/projects/p/history", channelLogsHref: "/projects/p/history/channels" },
};
export default meta;
type Story = StoryObj<typeof HistoryTabs>;

export const WorkOrders: Story = { args: { active: "work-orders" } };
export const ChannelLogs: Story = { args: { active: "channel-logs" } };

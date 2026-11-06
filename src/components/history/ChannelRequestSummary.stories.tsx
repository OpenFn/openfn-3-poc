import type { Meta, StoryObj } from "@storybook/react";
import { channelRequestDetail as request } from "@/mock-data/channel-requests";
import { withRouter } from "@/stories/decorators";
import ChannelRequestSummary from "./ChannelRequestSummary";

const meta = {
  title: "History/ChannelRequestSummary",
  component: ChannelRequestSummary,
  decorators: [withRouter],
} satisfies Meta<typeof ChannelRequestSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { request, channelHref: "/projects/p1/channels/c1/edit" } };
export const DestinationError: Story = {
  args: { ...Success.args, request: { ...request, state: "failed", response: { status: 404, headers: null, body: null, bodySize: 96 } } },
};
export const ConnectionRefused: Story = {
  args: {
    ...Success.args,
    request: {
      ...request,
      state: "error",
      clientAuth: { type: null, methodId: null, methodName: null },
      destinationCredential: null,
      response: null,
      errorMessage: "econnrefused",
      errorCategory: "transport",
    },
  },
};

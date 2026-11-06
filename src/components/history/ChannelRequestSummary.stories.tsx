import type { Meta, StoryObj } from "@storybook/react";
import { withRouter } from "@/stories/decorators";
import type { ChannelRequestDetail } from "@/types/channels";
import ChannelRequestSummary from "./ChannelRequestSummary";

const meta = {
  title: "History/ChannelRequestSummary",
  component: ChannelRequestSummary,
  decorators: [withRouter],
} satisfies Meta<typeof ChannelRequestSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

const request: ChannelRequestDetail = {
  id: "4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60",
  requestId: "c81d3e5a-77f2-4c0b-a1e9-3b6f0d2c9e14",
  channelId: "5c3e9a1d-7b2f-4e8a-9c6d-1f0e2d3c4b5a",
  state: "success",
  startedAt: "2026-10-14T09:31:12Z",
  completedAt: "2026-10-14T09:31:12.284Z",
  clientIdentity: "10.0.4.17",
  clientAuth: { type: "api", methodId: "wam-partner-api", methodName: "Partner API key" },
  destinationCredential: { id: "cred-hapi-fhir", name: "OpenHIE HAPI FHIR" },
  snapshot: { name: "SHR proxy", destinationUrl: "https://openhim.example.org/fhir", lockVersion: 3 },
  request: { method: "POST", path: "/fhir/Patient", queryString: null, headers: null, body: null, bodySize: 152 },
  response: { status: 201, headers: null, body: null, bodySize: 48 },
  errorMessage: null,
  errorCategory: null,
  timing: { latencyUs: 284_000, queueUs: null, connectUs: null, requestSendUs: null, ttfbUs: null, responseDurationUs: null },
  wiped: false,
};

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

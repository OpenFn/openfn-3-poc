import type { Meta, StoryObj } from "@storybook/react";
import { channelRequestDetail as success } from "@/mock-data/channel-requests";
import { projects } from "@/mock-data/projects";
import { withCanvas, withRouter } from "@/stories/decorators";
import type { ChannelRequestDetail } from "@/types/channels";
import ChannelRequestShowPage from "./ChannelRequestShowPage";

const project = projects[0]!;
const base = `/projects/${project.id}`;
const noResponse = (errorMessage: string, errorCategory: ChannelRequestDetail["errorCategory"]): ChannelRequestDetail => ({
  ...success,
  state: "error",
  response: null,
  errorMessage,
  errorCategory,
  timing: { latencyUs: 5_000_000, queueUs: null, connectUs: null, requestSendUs: null, ttfbUs: null, responseDurationUs: null },
});

const meta: Meta<typeof ChannelRequestShowPage> = {
  title: "Pages/History/ChannelRequestShowPage",
  component: ChannelRequestShowPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    request: success,
    channelLockVersion: 3,
    canEditDataRetention: true,
    adminContacts: ["demo@openfn.org"],
    historyHref: `${base}/history`,
    channelLogsHref: `${base}/history/channels`,
    channelHref: `${base}/channels/${success.channelId}/edit`,
  },
};
export default meta;
type Story = StoryObj<typeof ChannelRequestShowPage>;

export const Success: Story = {};
export const DestinationError: Story = {
  args: {
    request: {
      ...success,
      state: "failed",
      request: { ...success.request!, method: "GET", path: "/fhir/Patient/99999", queryString: "_format=json", body: "", bodySize: 0 },
      response: { status: 404, headers: [["content-type", "application/fhir+json"]], body: JSON.stringify({ resourceType: "OperationOutcome" }, null, 2), bodySize: 40 },
    },
  },
};
export const Timeout: Story = { args: { request: { ...noResponse("response_timeout", "transport"), state: "timeout" } } };
export const ConfigChanged: Story = { args: { channelLockVersion: 4 } };
export const TransportError: Story = { args: { request: noResponse("econnrefused", "transport") } };
export const CredentialError: Story = { args: { request: noResponse("oauth_refresh_failed", "credential") } };
export const UnknownError: Story = { args: { request: noResponse("tls_alert", null) } };
export const DeletedAuth: Story = {
  args: { request: { ...success, clientAuth: { type: "api", methodId: "wam-gone", methodName: null }, destinationCredential: { id: "cred-gone", name: null } } },
};
export const Pending: Story = { args: { request: { ...success, state: "pending", completedAt: null, response: null, timing: null } } };
const wiped: ChannelRequestDetail = {
  ...success,
  wiped: true,
  clientIdentity: null,
  request: { ...success.request!, path: null, headers: null, body: null },
  response: { ...success.response!, headers: null, body: null },
};
export const Wiped: Story = { args: { request: wiped } };
export const WipedForEditor: Story = { args: { request: wiped, canEditDataRetention: false } };
export const Loading: Story = { args: { status: { state: "loading" }, request: null } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, request: null } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, request: null } };
export const NotFound: Story = { args: { status: { state: "notFound" }, request: null } };

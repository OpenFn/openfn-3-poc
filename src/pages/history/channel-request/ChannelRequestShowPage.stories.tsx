import type { Meta, StoryObj } from "@storybook/react";
import { projects } from "@/mock-data/projects";
import { withCanvas, withRouter } from "@/stories/decorators";
import type { ChannelRequestDetail } from "@/types/channels";
import ChannelRequestShowPage from "./ChannelRequestShowPage";

const project = projects[0]!;
const base = `/projects/${project.id}`;
const success: ChannelRequestDetail = {
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
  request: {
    method: "POST",
    path: "/fhir/Patient",
    queryString: null,
    headers: [
      ["content-type", "application/json"],
      ["authorization", "[REDACTED]"],
    ],
    body: JSON.stringify({ resourceType: "Patient", gender: "female" }, null, 2),
    bodySize: 54,
  },
  response: {
    status: 201,
    headers: [["content-type", "application/fhir+json"]],
    body: JSON.stringify({ resourceType: "Patient", id: "58213" }, null, 2),
    bodySize: 48,
  },
  errorMessage: null,
  errorCategory: null,
  timing: { latencyUs: 284_000, queueUs: 1_200, connectUs: 38_400, requestSendUs: 2_100, ttfbUs: 251_000, responseDurationUs: 31_000 },
  wiped: false,
};
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

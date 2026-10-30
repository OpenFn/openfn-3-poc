import type { Meta, StoryObj } from "@storybook/react";
import ChannelRequestShowPage from "./ChannelRequestShowPage";
import { channelRequests } from "../../mock-data/channel-requests";
import { findChannel } from "../../mock-data/channels";
import { projects } from "../../mock-data/projects";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const success = channelRequests[0]!;
const transportError = channelRequests.find((r) => r.state === "error")!;
const credentialError: typeof transportError = {
  ...transportError,
  events: transportError.events.map((e) => (e.type === "error" ? { ...e, errorMessage: "oauth_refresh_failed" } : e)),
};

const meta: Meta<typeof ChannelRequestShowPage> = {
  title: "Pages/History/ChannelRequestShowPage",
  component: ChannelRequestShowPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    request: success,
    channel: findChannel(success.channelId)!,
    canEditDataRetention: true,
    adminContacts: [],
  },
};
export default meta;
type Story = StoryObj<typeof ChannelRequestShowPage>;

export const Success: Story = {};
export const TransportError: Story = { args: { request: transportError, channel: findChannel(transportError.channelId)! } };
export const CredentialError: Story = { args: { request: credentialError, channel: findChannel(credentialError.channelId)! } };
export const Wiped: Story = {
  args: { request: { ...success, isWiped: true }, canEditDataRetention: false, adminContacts: ["admin@openfn.org"] },
};

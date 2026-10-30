import type { Meta, StoryObj } from "@storybook/react";
import ChannelsIndexPage from "./ChannelsIndexPage";
import { channelsIn } from "../../mock-data/channels";
import { projects } from "../../mock-data/projects";
import type { ChannelRow } from "../../types/channels";
import { channelProxyUrl } from "../../utils/urls";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const logs = `/projects/${project.id}/history/channels`;
const channels: ChannelRow[] = channelsIn(project.id).map((c) => ({
  ...c,
  proxyUrl: channelProxyUrl(c.id),
  logsHref: `${logs}?filters[channel_id]=${c.id}`,
}));

const meta: Meta<typeof ChannelsIndexPage> = {
  title: "Pages/Projects/ChannelsIndexPage",
  component: ChannelsIndexPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    channels,
    totalChannels: channels.length,
    totalRequests: channels.reduce((sum, c) => sum + c.requestCount, 0),
    logsHref: logs,
    canCreateChannel: true,
    canEditChannel: true,
    canDeleteChannel: true,
    form: null,
    onToggle: async () => {},
    onDelete: async () => {},
    onSave: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof ChannelsIndexPage>;

export const Default: Story = {};
export const Empty: Story = { args: { channels: [], totalChannels: 0, totalRequests: 0 } };
export const CannotCreate: Story = { args: { canCreateChannel: false, canEditChannel: false, canDeleteChannel: false } };

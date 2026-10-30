import type { Meta, StoryObj } from "@storybook/react";
import HistoryChannelLogsPage from "./HistoryChannelLogsPage";
import { channelRequests } from "../../mock-data/channel-requests";
import { channels } from "../../mock-data/channels";
import { projects } from "../../mock-data/projects";
import type { ChannelLogRow } from "../../types/channels";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const rows: ChannelLogRow[] = channelRequests.map((r) => ({
  id: r.id,
  requestId: r.requestId,
  channelId: r.channelId,
  channelName: channels.find((c) => c.id === r.channelId)?.name ?? "",
  startedAt: r.startedAt,
  state: r.state,
  requestPath: r.events.find((e) => e.type === "destination_response")?.requestPath ?? null,
  errorMessage: r.events.find((e) => e.type === "error")?.errorMessage ?? null,
}));
const filterTo = rows[0]!.channelId;

const meta: Meta<typeof HistoryChannelLogsPage> = {
  title: "Pages/History/HistoryChannelLogsPage",
  component: HistoryChannelLogsPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    channelsEnabled: true,
    workOrdersHref: `/projects/${project.id}/history`,
    channelLogsHref: `/projects/${project.id}/history/channels`,
    channels: channels.map(({ id, name }) => ({ id, name })),
    channelId: null,
    rows,
    page: { number: 1, size: 10, totalEntries: rows.length },
  },
};
export default meta;
type Story = StoryObj<typeof HistoryChannelLogsPage>;

export const Default: Story = {};
export const Filtered: Story = {
  args: {
    channelId: filterTo,
    rows: rows.filter((r) => r.channelId === filterTo),
    page: { number: 1, size: 10, totalEntries: rows.filter((r) => r.channelId === filterTo).length },
  },
};
export const Empty: Story = { args: { rows: [], page: { number: 1, size: 10, totalEntries: 0 } } };

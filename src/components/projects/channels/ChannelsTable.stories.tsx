import type { Meta, StoryObj } from "@storybook/react";
import ChannelsTable from "./ChannelsTable";
import { channelsIn } from "../../../mock-data/channels";
import { projects } from "../../../mock-data/projects";
import { withRouter } from "../../../stories/decorators";
import type { ChannelRow } from "../../../types/channels";
import { channelProxyUrl } from "../../../utils/urls";

const project = projects[0]!;
const rows: ChannelRow[] = channelsIn(project.id).map((c) => ({
  ...c,
  proxyUrl: channelProxyUrl(c.id),
  logsHref: `/projects/${project.id}/history/channels?filters[channel_id]=${c.id}`,
}));

const meta: Meta<typeof ChannelsTable> = {
  title: "Projects/Channels/ChannelsTable",
  component: ChannelsTable,
  decorators: [withRouter],
  args: { channels: rows },
};
export default meta;
type Story = StoryObj<typeof ChannelsTable>;

export const Default: Story = {};
export const ReadOnly: Story = { args: { canEdit: false, canDelete: false } };
export const Empty: Story = { args: { channels: [] } };
/** A disabled channel: its name is greyed and the switch is off. */
export const DisabledChannel: Story = { args: { channels: rows.map((r, i) => (i === 0 ? { ...r, enabled: false } : r)) } };
/** A channel that has never had a request: "Never" for its last activity. */
export const NeverActive: Story = {
  args: { channels: rows.map((r, i) => (i === 0 ? { ...r, requestCount: 0, lastActivityAt: null } : r)) },
};
export const LongValues: Story = {
  args: {
    channels: rows.map((r, i) =>
      i === 0
        ? {
            ...r,
            name: "Forward lab results from the district laboratory information system to the national registry",
            destinationUrl: "https://registry.health.example.org/api/v2/laboratory/results/incoming?source=district-lis&format=fhir",
          }
        : r,
    ),
  },
};

/** Clicks the first row's Delete, then the confirm's Delete. */
const confirmDelete: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  const doc = canvasElement.ownerDocument;
  [...canvasElement.querySelectorAll("button")].find((b) => b.textContent === "Delete")?.click();
  await new Promise((r) => setTimeout(r));
  doc.querySelector<HTMLButtonElement>('[role="dialog"] button[type="submit"]')?.click();
};
/** The delete is still out: the confirm shows pending. */
export const DeletePending: Story = { args: { onDelete: () => new Promise(() => {}) }, play: confirmDelete };
/** The host refuses: the confirm stays open with the message. */
export const DeleteFails: Story = {
  args: { onDelete: () => Promise.reject(new Error("You are not authorized to delete this channel.")) },
  play: confirmDelete,
};

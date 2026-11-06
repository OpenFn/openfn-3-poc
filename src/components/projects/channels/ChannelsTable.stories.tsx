import type { Meta, StoryObj } from "@storybook/react";
import ChannelsTable from "./ChannelsTable";
import { channelRowsFor } from "@/mock-data/channels";
import { projects } from "@/mock-data/projects";
import { withRouter } from "@/stories/decorators";

const project = projects[0]!;
const rows = channelRowsFor(project.id);

const meta: Meta<typeof ChannelsTable> = {
  title: "Projects/Channels/ChannelsTable",
  component: ChannelsTable,
  decorators: [withRouter],
  args: {
    channels: rows,
    canEdit: true,
    canDelete: true,
    editHref: (id) => `/projects/${project.id}/channels/${id}/edit`,
    logsHref: (id) => `/projects/${project.id}/history/channels?filters[channel_id]=${id}`,
    onToggle: () => Promise.resolve(),
    onDelete: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof ChannelsTable>;

export const Default: Story = {};
/** A viewer: Enabled in words, no Edit or Delete. */
export const ReadOnly: Story = { args: { canEdit: false, canDelete: false } };
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

/** The server refuses a switch: it goes back, and the message stays in a toast. */
export const SwitchFails: Story = {
  args: { onToggle: () => Promise.reject(new Error("Someone else changed this channel since you loaded it. Load it again and retry.")) },
  play: async ({ canvasElement }) => canvasElement.querySelector<HTMLButtonElement>('[role="switch"]')?.click(),
};

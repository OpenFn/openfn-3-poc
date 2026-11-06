import type { Meta, StoryObj } from "@storybook/react";
import ChannelsIndexPage from "./ChannelsIndexPage";
import { channelRowsFor, projectCredentialOptions, webhookAuthMethodOptions } from "@/mock-data/channels";
import { projects } from "@/mock-data/projects";
import { withCanvas, withRouter } from "@/stories/decorators";

const project = projects[0]!;
const base = `/projects/${project.id}`;
const channels = channelRowsFor(project.id);

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
    canCreateChannel: true,
    canEditChannel: true,
    canDeleteChannel: true,
    createHref: `${base}/channels/new`,
    editHref: (id) => `${base}/channels/${id}/edit`,
    logsHref: (id) => `${base}/history/channels?filters[channel_id]=${id}`,
    credentialsSettingsHref: `${base}/settings#credentials`,
    webhookSecuritySettingsHref: `${base}/settings#webhook_security`,
    creating: false,
    editingId: null,
    credentialOptions: projectCredentialOptions,
    authMethodOptions: webhookAuthMethodOptions,
    onClose: () => {},
    onCreate: () => Promise.resolve(),
    onUpdate: () => Promise.resolve(),
    onDelete: () => Promise.resolve(),
  },
};
export default meta;
type Story = StoryObj<typeof ChannelsIndexPage>;

export const Default: Story = {};
/** A viewer: New channel is off, Enabled is words, and there's no Edit or Delete. */
export const Viewer: Story = { args: { canCreateChannel: false, canEditChannel: false, canDeleteChannel: false } };
export const Empty: Story = { args: { channels: [] } };
export const Long: Story = {
  args: {
    channels: channels.map((c, i) =>
      i === 0
        ? {
            ...c,
            name: "Forward lab results from the district laboratory information system to the national registry",
            destinationUrl: "https://registry.health.example.org/api/v2/laboratory/results/incoming?source=district-lis&format=fhir",
          }
        : c,
    ),
  },
};
export const Loading: Story = { args: { status: { state: "loading" }, channels: [] } };
export const NoAccess: Story = { args: { status: { state: "forbidden" }, channels: [] } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, channels: [] } };
export const Creating: Story = { args: { creating: true } };
export const Editing: Story = { args: { editingId: channels[0]!.id } };

import type { Meta, StoryObj } from "@storybook/react";
import ProxyUrlCopy from "./ProxyUrlCopy";
import { channels } from "../../../mock-data/channels";
import { channelProxyUrl } from "../../../utils/urls";

const meta: Meta<typeof ProxyUrlCopy> = {
  title: "Projects/Channels/ProxyUrlCopy",
  component: ProxyUrlCopy,
  args: { url: channelProxyUrl(channels[0]!.id) },
};
export default meta;
type Story = StoryObj<typeof ProxyUrlCopy>;

export const Default: Story = {};
export const Truncated: Story = {
  args: { leading: <span className="hero-arrow-right-end-on-rectangle h-4 w-4 shrink-0 text-faint" />, className: "max-w-64" },
};

import type { Meta, StoryObj } from "@storybook/react";
import GithubCard from "./GithubCard";

const connectHref = "https://github.com/login/oauth/authorize?client_id=demo";

const meta: Meta<typeof GithubCard> = { title: "Profile/GithubCard", component: GithubCard, args: { onDisconnect: async () => {} } };
export default meta;
type Story = StoryObj<typeof GithubCard>;

export const OauthNotEnabled: Story = { args: { github: { connectHref: null, status: "none" } } };
export const NotConnected: Story = { args: { github: { connectHref, status: "none" } } };
export const Expired: Story = { args: { github: { connectHref, status: "expired" } } };
export const Connected: Story = { args: { github: { connectHref, status: "connected" } } };

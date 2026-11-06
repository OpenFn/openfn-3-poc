import type { Meta, StoryObj } from "@storybook/react";
import AdminAuthProvidersPage from "./AdminAuthProvidersPage";
import { authProvider, instanceUrl } from "@/mock-data/admin";
import { withCanvas, withRouter } from "@/stories/decorators";

const done = async () => {};

const meta: Meta<typeof AdminAuthProvidersPage> = {
  title: "Pages/Admin/AdminAuthProvidersPage",
  component: AdminAuthProvidersPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { provider: authProvider, instanceUrl, onSave: done, onRemove: done },
};
export default meta;
type Story = StoryObj<typeof AdminAuthProvidersPage>;

export const Existing: Story = {};
/** None set up: the notice, and a blank form whose secret is required. */
export const NoProvider: Story = { args: { provider: null } };
export const Loading: Story = { args: { status: { state: "loading" }, provider: null } };
export const LoadFailed: Story = { args: { status: { state: "error", message: "Something went wrong in Lightning." }, provider: null } };
export const LongText: Story = {
  args: {
    provider: {
      ...authProvider,
      name: "a-very-long-provider-name-that-somebody-typed-for-their-identity-server",
      discoveryUrl: "https://login.a-very-long-identity-provider-domain.example.org/realms/a-very-long-realm-name/.well-known/openid-configuration",
      clientId: "1081234567890-abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop.apps.googleusercontent.com",
    },
  },
};

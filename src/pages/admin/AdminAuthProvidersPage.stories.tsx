import type { Meta, StoryObj } from "@storybook/react";
import AdminAuthProvidersPage from "./AdminAuthProvidersPage";
import { authProvider, emptyAuthProvider } from "../../mock-data/admin";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};

const meta: Meta<typeof AdminAuthProvidersPage> = {
  title: "Pages/Admin/AdminAuthProvidersPage",
  component: AdminAuthProvidersPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { provider: emptyAuthProvider, onSave: done, onTest: done, onRemove: done },
};
export default meta;
type Story = StoryObj<typeof AdminAuthProvidersPage>;

export const New: Story = {};
export const Existing: Story = { args: { provider: authProvider ?? emptyAuthProvider } };

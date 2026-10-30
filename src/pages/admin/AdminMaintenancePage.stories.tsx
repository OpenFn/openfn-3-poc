import type { Meta, StoryObj } from "@storybook/react";
import AdminMaintenancePage from "./AdminMaintenancePage";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof AdminMaintenancePage> = {
  title: "Pages/Admin/AdminMaintenancePage",
  component: AdminMaintenancePage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { onRefreshAdaptors: async () => {}, onRefreshIcons: async () => {} },
};
export default meta;
type Story = StoryObj<typeof AdminMaintenancePage>;

export const Default: Story = {};
/** Both refreshes still out: each Run button shows pending. */
export const Pending: Story = {
  args: { onRefreshAdaptors: () => new Promise(() => {}), onRefreshIcons: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    canvasElement.querySelectorAll<HTMLButtonElement>('button[aria-label^="Run "]').forEach((b) => b.click());
  },
};

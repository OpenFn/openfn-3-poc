import type { Meta, StoryObj } from "@storybook/react";
import AdminLiveDashboardPage from "./AdminLiveDashboardPage";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof AdminLiveDashboardPage> = {
  title: "Pages/Admin/AdminLiveDashboardPage",
  component: AdminLiveDashboardPage,
  // A full page of its own, outside the app shell.
  decorators: [withRouter],
  parameters: { layout: "fullscreen" },
};
export default meta;

export const Default: StoryObj<typeof AdminLiveDashboardPage> = {};

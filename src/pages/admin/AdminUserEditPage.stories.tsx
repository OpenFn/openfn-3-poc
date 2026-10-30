import type { Meta, StoryObj } from "@storybook/react";
import AdminUserEditPage from "./AdminUserEditPage";
import { users } from "../../mock-data/users";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof AdminUserEditPage> = {
  title: "Pages/Admin/AdminUserEditPage",
  component: AdminUserEditPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: { user: null, onSave: async () => {}, cancelHref: "/settings/users" },
};
export default meta;
type Story = StoryObj<typeof AdminUserEditPage>;

export const NewUser: Story = {};
export const EditUser: Story = { args: { user: users[1]! } };

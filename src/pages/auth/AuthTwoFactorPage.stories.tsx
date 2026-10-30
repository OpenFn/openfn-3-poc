import type { Meta, StoryObj } from "@storybook/react";
import AuthTwoFactorPage from "./AuthTwoFactorPage";
import { withCanvas, withRouterAt } from "../../stories/decorators";

const meta: Meta<typeof AuthTwoFactorPage> = {
  title: "Pages/Auth/AuthTwoFactorPage",
  component: AuthTwoFactorPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthTwoFactorPage>;

export const AuthenticatorCode: Story = { decorators: [withRouterAt("/users/two_factor"), withCanvas("h-screen")] };
export const BackupCode: Story = {
  decorators: [withRouterAt("/users/two_factor?authentication_type=backup_code"), withCanvas("h-screen")],
};
export const InvalidCode: Story = { decorators: [withRouterAt("/users/two_factor?error=1"), withCanvas("h-screen")] };

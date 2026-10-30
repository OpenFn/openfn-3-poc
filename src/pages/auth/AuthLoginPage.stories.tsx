import type { Meta, StoryObj } from "@storybook/react";
import AuthLoginPage from "./AuthLoginPage";
import { withCanvas, withRouterAt } from "../../stories/decorators";

const meta: Meta<typeof AuthLoginPage> = {
  title: "Pages/Auth/AuthLoginPage",
  component: AuthLoginPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthLoginPage>;

export const Default: Story = { decorators: [withRouterAt("/users/log_in"), withCanvas("h-screen")] };
export const InvalidCredentials: Story = { decorators: [withRouterAt("/users/log_in?error=1"), withCanvas("h-screen")] };
export const WithSso: Story = { decorators: [withRouterAt("/users/log_in?sso=1"), withCanvas("h-screen")] };
export const SignupAllowed: Story = { decorators: [withRouterAt("/users/log_in?signup=1"), withCanvas("h-screen")] };

import type { Meta, StoryObj } from "@storybook/react";
import AuthRegisterPage from "./AuthRegisterPage";
import { withCanvas, withRouterAt } from "../../stories/decorators";

const meta: Meta<typeof AuthRegisterPage> = {
  title: "Pages/Auth/AuthRegisterPage",
  component: AuthRegisterPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthRegisterPage>;

export const SignupAllowed: Story = { decorators: [withRouterAt("/users/register?signup=1"), withCanvas("h-screen")] };
export const SignupOff: Story = { decorators: [withRouterAt("/users/register"), withCanvas("h-screen")] };

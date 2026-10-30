import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import AuthResetPasswordPage from "./AuthResetPasswordPage";
import { withCanvas, withRouterAt } from "../../stories/decorators";

/** Opens the page at `url` under its route, so the `:token` param reaches it. */
const at =
  (url: string): Decorator[] => [
    (Story) => (
      <Routes>
        <Route path="/users/reset_password" element={<Story />} />
        <Route path="/users/reset_password/:token" element={<Story />} />
      </Routes>
    ),
    withRouterAt(url),
    withCanvas("h-screen"),
  ];

const meta: Meta<typeof AuthResetPasswordPage> = {
  title: "Pages/Auth/AuthResetPasswordPage",
  component: AuthResetPasswordPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthResetPasswordPage>;

export const RequestLink: Story = { decorators: at("/users/reset_password") };
export const WithToken: Story = { decorators: at("/users/reset_password/a-token") };

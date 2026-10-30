import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import AuthConfirmAccountPage from "./AuthConfirmAccountPage";
import { withCanvas, withRouterAt } from "../../stories/decorators";

/** Opens the page at `url` under its route, so the `:token` param reaches it. */
const at =
  (url: string): Decorator[] => [
    (Story) => (
      <Routes>
        <Route path="/users/confirm" element={<Story />} />
        <Route path="/users/confirm/:token" element={<Story />} />
      </Routes>
    ),
    withRouterAt(url),
    withCanvas("h-screen"),
  ];

const meta: Meta<typeof AuthConfirmAccountPage> = {
  title: "Pages/Auth/AuthConfirmAccountPage",
  component: AuthConfirmAccountPage,
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthConfirmAccountPage>;

export const RequestLink: Story = { decorators: at("/users/confirm") };
export const WithToken: Story = { decorators: at("/users/confirm/a-token") };

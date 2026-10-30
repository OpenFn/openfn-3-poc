import type { Meta, StoryObj } from "@storybook/react";
import MfaRequiredPage from "./MfaRequiredPage";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof MfaRequiredPage> = {
  title: "Pages/Projects/MfaRequiredPage",
  component: MfaRequiredPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof MfaRequiredPage>;

export const Default: Story = {};

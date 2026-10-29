import type { Meta, StoryObj } from "@storybook/react";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof SandboxSettingsBanner> = {
  title: "Project settings/SandboxSettingsBanner",
  component: SandboxSettingsBanner,
  decorators: [withRouter],
  args: { scope: "local" },
};
export default meta;
type Story = StoryObj<typeof SandboxSettingsBanner>;

export const Local: Story = {};
export const Editable: Story = { args: { scope: "editable" } };
export const Inherited: Story = {
  args: { scope: "inherited", parent: { name: "openhie-project", settingsHref: "/projects/p1/settings" } },
};

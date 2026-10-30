import type { Meta, StoryObj } from "@storybook/react";
import LandingScreen from "./LandingScreen";
import { withCanvas } from "../../stories/decorators";

const noop = () => {};
const meta: Meta<typeof LandingScreen> = {
  title: "Workflow/LandingScreen",
  component: LandingScreen,
  parameters: { layout: "fullscreen" },
  decorators: [withCanvas("h-175")],
  args: { onBuildWithAI: noop, onBuildFromScratch: noop, onBrowseTemplates: noop, onImportYAML: noop },
};
export default meta;
type Story = StoryObj<typeof LandingScreen>;

export const WithAI: Story = {};
export const WithoutAI: Story = { args: { aiAssistantEnabled: false } };

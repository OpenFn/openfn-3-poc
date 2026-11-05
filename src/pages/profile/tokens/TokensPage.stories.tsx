import type { Meta, StoryObj } from "@storybook/react";
import TokensPage from "./TokensPage";
import { apiTokens } from "@/mock-data/tokens";
import { withCanvas, withRouter } from "@/stories/decorators";

const meta: Meta<typeof TokensPage> = {
  title: "Pages/Profile/TokensPage",
  component: TokensPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    tokens: apiTokens,
    tokenId: null,
    onGenerate: async () => "demo.fake-token-not-real.QrStU-24680",
    onDelete: async () => {},
    onClose: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof TokensPage>;

export const WithTokens: Story = {};
export const Empty: Story = { args: { tokens: [] } };
// The banner and toast are the page's own, so the story clicks Generate to show them.
export const NewToken: Story = {
  play: async ({ canvasElement }) => {
    [...canvasElement.querySelectorAll("button")].find((b) => b.textContent?.includes("Generate New Token"))?.click();
    await new Promise((r) => setTimeout(r));
  },
};
export const DeleteModalOpen: Story = { args: { tokenId: apiTokens[0]!.id } };

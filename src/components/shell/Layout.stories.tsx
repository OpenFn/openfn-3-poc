import type { Meta, StoryObj } from "@storybook/react";
import Text from "@/components/primitives/Text";
import Layout from "./Layout";

const meta: Meta<typeof Layout> = { title: "Shell/Layout", component: Layout, parameters: { layout: "fullscreen" } };
export default meta;

/** The frame with stand-ins in its slots; Shell/AppShell shows it with the real sidebar. */
export const Default: StoryObj<typeof Layout> = {
  args: {
    sidebar: (
      <nav aria-label="Main" className="w-48 p-4">
        <Text>Sidebar slot</Text>
      </nav>
    ),
    children: (
      <div className="p-8">
        <Text>Page slot</Text>
      </div>
    ),
  },
};

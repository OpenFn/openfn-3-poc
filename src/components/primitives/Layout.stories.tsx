import type { Meta, StoryObj } from "@storybook/react";
import Text from "@/components/primitives/Text";
import Layout, { type SidebarFrame } from "./Layout";

const meta: Meta<typeof Layout> = { title: "Primitives/Layout", component: Layout, parameters: { layout: "fullscreen" } };
export default meta;

const sidebar = ({ collapsed }: SidebarFrame) => (
  <nav aria-label="Main" className="w-48 p-4">
    <Text>Sidebar slot{collapsed ? " (collapsed)" : ""}</Text>
  </nav>
);

/** The frame with stand-ins in its slots; Shell/AppShell shows it with OpenFn's sidebar. */
export const Default: StoryObj<typeof Layout> = {
  args: {
    sidebar,
    children: (
      <div className="p-8">
        <Text>Page slot</Text>
      </div>
    ),
  },
};

/** The page scrolls; the sidebar stays put. */
export const LongContent: StoryObj<typeof Layout> = {
  args: {
    sidebar,
    children: (
      <div className="h-full overflow-y-auto p-8">
        {Array.from({ length: 80 }, (_, i) => (
          <Text key={i}>Line {i + 1} of a long page</Text>
        ))}
      </div>
    ),
  },
};

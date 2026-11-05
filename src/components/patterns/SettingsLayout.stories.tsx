import type { Meta, StoryObj } from "@storybook/react";
import SettingsLayout from "./SettingsLayout";
import Button from "@/components/primitives/Button";
import Section from "@/components/primitives/Section";
import Text from "@/components/primitives/Text";
import { withCanvas, withRouter } from "@/stories/decorators";

const sections = [
  { label: "Profile", href: "/profile", icon: "hero-user-circle" },
  { label: "Credentials", href: "/credentials", icon: "hero-key" },
  { label: "API tokens", href: "/profile/tokens", icon: "hero-command-line" },
];

const meta: Meta<typeof SettingsLayout> = {
  title: "Patterns/SettingsLayout",
  component: SettingsLayout,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    title: "User settings",
    description: "Manage your profile, personal credentials and API tokens.",
    sections,
    current: "/profile/tokens",
    children: (
      <Section size="lg" title="API tokens" description="Each section draws its own heading and main action." action={<Button>Generate new token</Button>}>
        <Text as="p">The section's content.</Text>
      </Section>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof SettingsLayout>;

export const Default: Story = {};
// The menu keeps its share of the width; a long label wraps.
export const LongSectionLabel: Story = {
  args: { sections: [...sections, { label: "Connected systems and their webhook security", href: "/systems", icon: "hero-link" }] },
};

import type { Meta, StoryObj } from "@storybook/react";
import NavList from "./NavList";
import { withRouter, withWhitePanel } from "@/stories/decorators";

const items = [
  { label: "Profile", href: "/profile", icon: "hero-user-circle" },
  { label: "Credentials", href: "/credentials", icon: "hero-key" },
  { label: "API tokens", href: "/profile/tokens", icon: "hero-command-line" },
];

const meta: Meta<typeof NavList> = {
  title: "Primitives/NavList",
  component: NavList,
  decorators: [withRouter, withWhitePanel("w-56")],
  args: { label: "User settings sections", items, current: "/credentials" },
};
export default meta;
type Story = StoryObj<typeof NavList>;

export const Default: Story = {};
// Labels are the app's own words, so a long one wraps rather than hiding its end.
export const LongLabel: Story = {
  args: { items: [...items, { label: "Connected systems and their webhook security settings", href: "/systems", icon: "hero-link" }] },
};

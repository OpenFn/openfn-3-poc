import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import RadioCards from "./RadioCards";

const options = [
  { value: "basic", icon: "hero-globe-alt", label: "Basic HTTP Authentication (username & password)" },
  { value: "api", icon: "hero-code-bracket-square", label: "API Key Authentication (‘x-api-key’ header)" },
];

const meta: Meta<typeof RadioCards> = {
  title: "Primitives/RadioCards",
  component: RadioCards,
  args: { "aria-label": "Authentication type", options, value: null, onChange: () => {} },
};
export default meta;
type Story = StoryObj<typeof RadioCards>;

export const NonePicked: Story = {};
export const Picked: Story = { args: { value: "api" } };
/** Controlled, as pages use it: click or use the arrow keys. */
export const Interactive: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>(null);
    return <RadioCards {...args} value={value} onChange={setValue} />;
  },
};
export const WithLabelAndHint: Story = { args: { label: "Authentication type", "aria-label": undefined, hint: "How callers prove who they are." } };
export const WithError: Story = { args: { errors: ["can't be blank"] } };
export const Disabled: Story = { args: { value: "basic", disabled: true } };

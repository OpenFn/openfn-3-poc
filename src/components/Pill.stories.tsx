import type { Meta, StoryObj } from "@storybook/react";
import Pill from "./Pill";

const meta: Meta<typeof Pill> = { title: "Shared/Pill", component: Pill, args: { children: "main" } };
export default meta;
type Story = StoryObj<typeof Pill>;

export const Neutral: Story = {};
export const Success: Story = { args: { tone: "success", children: "Live" } };
export const Danger: Story = { args: { tone: "danger", children: "Deleted in sandbox" } };
export const Warning: Story = { args: { tone: "warning", children: "Read-only" } };
export const Info: Story = { args: { tone: "info", children: "New" } };
export const Solid: Story = { args: { variant: "solid", children: "Lost" } };
/** `color` is for tags that mean nothing, like dataclip types and HTTP methods. */
export const TagColour: Story = { args: { color: "purple", mono: true, children: "step_result" } };
export const Square: Story = { args: { color: "primary", square: true, children: "latest" } };
export const Removable: Story = { args: { color: "blue", children: "openhie-project", onRemove: () => {} } };

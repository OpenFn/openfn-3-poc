import type { Meta, StoryObj } from "@storybook/react";
import EmptyState from "./EmptyState";

const meta: Meta<typeof EmptyState> = { title: "Primitives/EmptyState", component: EmptyState };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => <EmptyState message="No sandboxes found" />,
};

export const Plain: Story = {
  render: () => <EmptyState variant="plain" message="No channels found." />,
};

export const WithTitle: Story = {
  render: () => (
    <EmptyState
      variant="plain"
      icon="hero-eye-slash"
      title="No Data Available"
      message="This dataclip's data has been wiped in accordance with the project's data retention policy."
    />
  ),
};

export const WithAction: Story = {
  render: () => <EmptyState message="No collections yet." buttonText="Create a new collection" onClick={() => {}} />,
};

/** The user can't create one: the box stays, the button is disabled. */
export const WithActionDisabled: Story = {
  render: () => <EmptyState message="No collections yet." buttonText="Create a new collection" onClick={() => {}} disabled />,
};

/** `fill` centres the message in a panel with nothing to show yet. */
export const Fill: Story = {
  render: () => (
    <div className="h-64 rounded-lg border border-subtle">
      <EmptyState variant="plain" fill message="Select a step to view input data" />
    </div>
  ),
};

/** `loading` pulses while the content is on its way. */
export const Loading: Story = {
  render: () => <EmptyState variant="plain" loading message="Loading ..." />,
};

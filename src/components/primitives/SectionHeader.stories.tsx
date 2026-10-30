import type { Meta, StoryObj } from "@storybook/react";
import SectionHeader from "./SectionHeader";
import Button from "./Button";

const meta: Meta<typeof SectionHeader> = {
  title: "Primitives/SectionHeader",
  component: SectionHeader,
  args: {
    title: "Project collaborators",
    subtitle: "View collaborators for this project",
    action: <Button>Add Collaborator(s)</Button>,
  },
};
export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {};
export const NoPermission: Story = { args: { permissionsSection: "collaborators" } };
export const Large: Story = { args: { size: "lg", title: "Data storage", subtitle: "View or modify data storage settings for this project.", action: undefined } };

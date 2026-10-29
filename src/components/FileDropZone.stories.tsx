import type { Meta, StoryObj } from "@storybook/react";
import FileDropZone from "./FileDropZone";

const meta: Meta<typeof FileDropZone> = {
  title: "Shared/FileDropZone",
  component: FileDropZone,
  args: {
    accept: ".json",
    label: "Upload a file or drag and drop",
    hint: "JSON, up to 8MB",
    invalidMessage: "Invalid file format. Please only upload: JSON",
    onFile: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof FileDropZone>;

export const Default: Story = {};
export const FillsItsParent: Story = {
  args: {
    accept: ".yaml,.yml",
    label: "Upload or drop a YAML file.",
    hint: "YML or YAML, up to 8MB",
    invalidMessage: "File must be .yml or .yaml format",
    className: "h-80",
  },
};

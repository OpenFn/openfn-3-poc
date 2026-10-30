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

function dragOnto(canvasElement: HTMLElement, type: "dragover" | "drop", fileName?: string) {
  const dataTransfer = new DataTransfer();
  if (fileName) dataTransfer.items.add(new File(["{}"], fileName));
  canvasElement.querySelector("label")?.dispatchEvent(new DragEvent(type, { bubbles: true, dataTransfer }));
}

export const Dragging: Story = {
  play: async ({ canvasElement }) => dragOnto(canvasElement, "dragover"),
};
/** A dropped file of the wrong type: the message stays until a valid file comes in. */
export const Invalid: Story = {
  play: async ({ canvasElement }) => dragOnto(canvasElement, "drop", "notes.txt"),
};

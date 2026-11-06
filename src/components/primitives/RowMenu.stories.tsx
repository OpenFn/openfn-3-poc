import type { Meta, StoryObj } from "@storybook/react";
import { MenuItem } from "./Menu";
import RowMenu from "./RowMenu";

const meta: Meta<typeof RowMenu> = {
  title: "Primitives/RowMenu",
  component: RowMenu,
  decorators: [(Story) => <div className="flex justify-center p-8 pb-64"><Story /></div>],
  args: {
    name: "DHIS2 Play",
    onDelete: () => {},
    children: (
      <>
        <MenuItem icon="hero-pencil">Edit</MenuItem>
        <MenuItem icon="hero-arrows-right-left">Transfer</MenuItem>
      </>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof RowMenu>;

export const Default: Story = {};
/** Opened, so axe checks it, with a blocked action and its reason. */
export const Open: Story = {
  args: {
    children: (
      <>
        <MenuItem icon="hero-pencil" disabled description="OAuth credentials can't be edited here yet.">
          Edit
        </MenuItem>
        <MenuItem icon="hero-arrows-right-left">Transfer</MenuItem>
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("button")?.click();
  },
};
export const DeleteNow: Story = {
  args: { deleteLabel: "Delete now", children: <MenuItem icon="hero-arrow-uturn-left">Cancel deletion</MenuItem> },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector("button")?.click();
  },
};

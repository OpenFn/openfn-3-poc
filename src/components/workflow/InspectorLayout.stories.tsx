import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import Button from "../primitives/Button";
import InspectorLayout, { InspectorFooter } from "./InspectorLayout";
import { withSidePanel } from "../../stories/decorators";

const meta: Meta<typeof InspectorLayout> = {
  title: "Workflow/InspectorLayout",
  component: InspectorLayout,
  decorators: [withSidePanel()],
  args: {
    title: "Path",
    onClose: () => {},
    children: <p>Panel body</p>,
  },
};
export default meta;
type Story = StoryObj<typeof InspectorLayout>;

/** A title that fits gets no tooltip on hover. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("heading", { name: "Path" }));
    await new Promise((r) => setTimeout(r, 300));
    await expect(within(canvasElement.ownerDocument.body).queryByRole("tooltip")).toBeNull();
  },
};
export const WithFooter: Story = {
  args: {
    footer: (
      <InspectorFooter
        leftButtons={<Button variant="secondary">Edit</Button>}
        rightButtons={<Button tone="danger">Delete</Button>}
      />
    ),
  },
};
export const BackButtonFixedHeight: Story = { args: { title: "Run from Transform data", onBack: () => {}, fixedHeight: true, bare: true } };

const longTitle = "Run from Fetch overdue referrals and upsert them as DHIS2 tracker events";
/** Hovered: the cut-off title shows in full. */
export const LongTitle: Story = {
  args: { title: longTitle, onBack: () => {} },
  play: async ({ canvasElement }) => {
    await userEvent.hover(within(canvasElement).getByRole("heading", { name: longTitle }));
    await expect(await within(canvasElement.ownerDocument.body).findByRole("tooltip")).toHaveTextContent(longTitle);
  },
};


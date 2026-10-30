import type { Meta, StoryObj } from "@storybook/react";
import { dataclips } from "../../mock-data/history";
import { withCanvas } from "../../stories/decorators";
import JsonViewer from "./JsonViewer";

const meta = {
  title: "History/JsonViewer",
  component: JsonViewer,
  decorators: [withCanvas("h-96")],
} satisfies Meta<typeof JsonViewer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HttpRequest: Story = { args: { body: { text: JSON.stringify(dataclips[0]!.body, null, 2) } } };
export const StepResult: Story = { args: { body: { text: JSON.stringify(dataclips[1]!.body, null, 2) } } };
export const LoadFailed: Story = { args: { body: { error: "Failed to load content" } } };
export const Empty: Story = { args: { body: { text: "{}" } } };
/** About 3 MB, 200,000 lines: a bulk sync's step input. */
export const LargeDataclip: Story = {
  args: {
    body: {
      text: JSON.stringify(
        { data: Array.from({ length: 22_000 }, (_, i) => ({ id: i, name: `Patient ${i}`, active: i % 2 === 0, visits: [i, i + 1] })) },
        null,
        2
      ),
    },
  },
};
/** The host is still fetching the body. */
export const Loading: Story = { args: { body: undefined } };

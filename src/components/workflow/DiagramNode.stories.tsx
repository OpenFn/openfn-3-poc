import type { Meta, StoryObj } from "@storybook/react";
import { adaptorIconUrl } from "../../utils/adaptors";
import { diagramParameters } from "../../stories/decorators";
import DiagramNode from "./DiagramNode";

const meta: Meta<typeof DiagramNode> = {
  title: "Workflow/DiagramNode",
  component: DiagramNode,
  parameters: diagramParameters,
  // The label is placed against the node's box, as the diagram positions it; the padding sits outside that box.
  decorators: [(Story) => <div className="flex h-64 items-center bg-page px-10"><div className="relative"><Story /></div></div>],
  args: {
    id: "job-transform",
    shape: "rect",
    label: "Transform data to FHIR standard",
    sublabel: "http",
    icon: <img src={adaptorIconUrl("@openfn/language-http")!} alt="http" />,
  },
};
export default meta;
type Story = StoryObj<typeof DiagramNode>;

export const Job: Story = {};
export const Selected: Story = { args: { selected: true } };
export const WithAddPath: Story = { args: { onAddPath: () => {} } };
export const RunSucceeded: Story = { args: { runState: "success", runMeta: "1s" } };
export const RunFailed: Story = { args: { runState: "fail", runMeta: "8s" } };
export const DidNotRun: Story = { args: { didRun: false } };
export const Trigger: Story = {
  args: {
    id: "trigger",
    shape: "circle",
    label: "Webhook trigger",
    sublabel: "On each request received",
    icon: <span className="hero-globe-alt block h-full w-full" />,
  },
};
export const DisabledTrigger: Story = { args: { ...Trigger.args, disabled: true } };

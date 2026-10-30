import type { Meta, StoryObj } from "@storybook/react";
import DiagramEdge from "./DiagramEdge";
import { withCanvas } from "../../stories/decorators";

const meta: Meta<typeof DiagramEdge> = {
  title: "Workflow/DiagramEdge",
  component: DiagramEdge,
  decorators: [withCanvas("h-96")],
  args: { id: "e1", source: { x: 160, y: 16 }, target: { x: 160, y: 276 }, conditionType: "on_job_success" },
};
export default meta;
type Story = StoryObj<typeof DiagramEdge>;

export const OnSuccess: Story = {};
export const OnFailureCurved: Story = { args: { conditionType: "on_job_failure", target: { x: 345, y: 276 } } };
export const Always: Story = { args: { conditionType: "always" } };
export const Disabled: Story = { args: { conditionType: "always", enabled: false } };
export const JsExpressionWithLabel: Story = {
  args: { conditionType: "js_expression", conditionLabel: "Has overdue referrals", target: { x: -25, y: 276 } },
};
export const Selected: Story = { args: { selected: true } };
export const Neighbour: Story = { args: { neighbour: true } };
export const DidntRun: Story = { args: { didRun: false } };
export const LongLabel: Story = {
  args: { conditionType: "js_expression", conditionLabel: "Only when the referral is overdue and the facility has capacity" },
};

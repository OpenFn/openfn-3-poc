import type { Meta, StoryObj } from "@storybook/react";
import { adaptorIconUrl } from "../../utils/adaptors";
import DiagramNode from "./DiagramNode";
import { withCanvas } from "../../stories/decorators";

const meta: Meta<typeof DiagramNode> = {
  title: "Workflow/DiagramNode",
  component: DiagramNode,
  decorators: [withCanvas("h-64 p-10")],
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
export const Running: Story = { args: { runState: "running" } };
export const Crash: Story = { args: { runState: "crash", runMeta: "3s" } };
export const StartedBy: Story = { args: { ...Trigger.args, startedBy: "editor@openfn.org", runMeta: "12/03/2026, 09:15:00" } };
export const AuthLock: Story = { args: { ...Trigger.args, secondaryIcon: <span className="hero-lock-closed block h-full w-full" /> } };
export const LongName: Story = {
  args: { label: "Transform_patient_registrations_into_FHIR_bundles_for_the_national_shared_health_record" },
};

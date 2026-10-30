import type { Meta, StoryObj } from "@storybook/react";
import { findWorkflowGraph } from "../../mock-data/workflow";
import JobInspector from "./JobInspector";
import { withSidePanel } from "../../stories/decorators";

const graph = findWorkflowGraph("wf-openhie")!;
const noop = () => {};

const meta: Meta<typeof JobInspector> = {
  title: "Workflow/JobInspector",
  component: JobInspector,
  decorators: [withSidePanel()],
  args: {
    job: graph.jobs[0]!,
    projectId: graph.projectId,
    adaptorsInUse: ["http"],
    onChange: noop,
    onClose: noop,
    onOpenEditor: noop,
    onDelete: noop,
    onRunFromHere: noop,
  },
};
export default meta;
type Story = StoryObj<typeof JobInspector>;

export const Http: Story = {};
export const WithCredential: Story = { args: { job: findWorkflowGraph("wf-dhis2-sheets")!.jobs[0]! } };
export const NeedsCredential: Story = { args: { job: findWorkflowGraph("wf-dhis2-sheets")!.jobs[1]! } };
export const CannotDelete: Story = { args: { canDelete: false } };
export const LongNames: Story = {
  args: {
    job: {
      ...findWorkflowGraph("wf-dhis2-sheets")!.jobs[0]!,
      name: "Transform_patient_registrations_into_FHIR_bundles_for_the_national_shared_health_record",
      credentialName: "DHIS2 national production instance (read-only service account)",
    },
  },
};

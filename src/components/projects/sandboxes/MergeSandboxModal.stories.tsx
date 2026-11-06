import type { Meta, StoryObj } from "@storybook/react";
import { samplePreview, storyWorkspace } from "@/mock-data/sandboxes";
import { RequestError } from "@/utils/errors";
import MergeSandboxModal from "./MergeSandboxModal";

const sandbox = storyWorkspace[1]!;

const meta: Meta<typeof MergeSandboxModal> = {
  title: "Projects/Sandboxes/MergeSandboxModal",
  component: MergeSandboxModal,
  args: {
    sandbox: { ...sandbox, descendantCount: 1, mergeTargets: [...sandbox.mergeTargets, { id: "s2", name: "staging" }] },
    gracePeriodDays: 7,
    onPreview: async (targetId) => ({ ...samplePreview, targetId }),
    onClose: () => {},
    onMerge: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof MergeSandboxModal>;

export const Default: Story = {};
export const NothingChanged: Story = { args: { onPreview: async (targetId) => ({ targetId, workflows: [], credentials: [] }) } };
export const PreviewFails: Story = {
  args: {
    onPreview: async () => {
      throw new RequestError("You are not allowed to do that.");
    },
  },
};
/** Press Merge to see the server's refusal in the dialog. */
export const MergeFails: Story = {
  args: {
    onMerge: async () => {
      throw new RequestError("You are not authorized to merge into this project");
    },
  },
};
/** The preview is still loading. */
export const Loading: Story = { args: { onPreview: () => new Promise(() => {}) } };
export const Long: Story = {
  args: {
    sandbox: {
      ...sandbox,
      name: "fhir-mapping-for-the-national-patient-registry-integration-v2",
      mergeTargets: [{ id: "p1", name: "openhie-project-for-the-national-health-information-exchange" }],
    },
    onPreview: async (targetId) => ({
      ...samplePreview,
      targetId,
      workflows: [{ id: "w1", name: "Forward lab results from the district laboratory information system to the national registry", isDiverged: true, isDeleted: false }],
    }),
  },
};

import type { Meta, StoryObj } from "@storybook/react";
import { samplePreview } from "../../../mock-data/sandboxes";
import { RequestError } from "../../../utils/errors";
import MergeSandboxModal from "./MergeSandboxModal";

const meta: Meta<typeof MergeSandboxModal> = {
  title: "Projects/Sandboxes/MergeSandboxModal",
  component: MergeSandboxModal,
  args: {
    sandboxName: "fhir-mapping-v2",
    descendantCount: 1,
    gracePeriodDays: 7,
    onPreview: async (targetId) => ({ ...samplePreview, targetId: targetId ?? samplePreview.targetId }),
    onClose: () => {},
    onMerge: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof MergeSandboxModal>;

export const Default: Story = {};
export const NothingToMerge: Story = {
  args: { onPreview: async () => ({ ...samplePreview, workflows: [], credentials: [], collectionsToAdd: [] }) },
};
export const NoTarget: Story = { args: { onPreview: async () => ({ ...samplePreview, targets: [], targetId: null }) } };
export const PreviewFails: Story = {
  args: {
    onPreview: async () => {
      throw new RequestError("You are not authorized to merge this sandbox");
    },
  },
};
/** Press Merge to see the host's refusal in the modal. */
export const MergeFails: Story = {
  args: {
    onMerge: async () => {
      throw new RequestError("Merge failed: the target changed");
    },
  },
};
/** The preview is still loading. */
export const Loading: Story = { args: { onPreview: () => new Promise(() => {}) } };

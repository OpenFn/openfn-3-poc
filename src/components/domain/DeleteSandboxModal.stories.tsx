import type { Meta, StoryObj } from "@storybook/react";
import DeleteSandboxModal from "./DeleteSandboxModal";

const meta: Meta<typeof DeleteSandboxModal> = {
  title: "Domain/DeleteSandboxModal",
  component: DeleteSandboxModal,
  args: { sandboxName: "fhir-mapping-v2", rootName: "openhie-project", gracePeriodDays: 7, onClose: () => {}, onConfirm: async () => {} },
};
export default meta;
type Story = StoryObj<typeof DeleteSandboxModal>;

export const Default: Story = {};
export const WithChildren: Story = { args: { descendantCount: 2 } };
export const CurrentProject: Story = { args: { isCurrent: true } };
export const NoGracePeriodSetting: Story = { args: { gracePeriodDays: null } };

import type { Meta, StoryObj } from "@storybook/react";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { withRouter } from "@/stories/decorators";
import SandboxActions from "./SandboxActions";

const live = storyWorkspace[1]!;
const scheduled = storyWorkspace[2]!;

const meta: Meta<typeof SandboxActions> = {
  title: "Projects/Sandboxes/SandboxActions",
  component: SandboxActions,
  decorators: [withRouter],
  args: { sandbox: live, editHref: `/projects/p/sandboxes/${live.id}/edit`, restoreBlockedReason: null, restoring: false, onMerge: () => {}, onDelete: () => {}, onRestore: () => {} },
};
export default meta;
type Story = StoryObj<typeof SandboxActions>;

/** Open the menu: Edit, Merge, and Delete last in red. */
export const Default: Story = {};
/** Open the menu: each item greyed with Lightning's reason. */
export const NotAuthorized: Story = { args: { sandbox: { ...live, canEdit: false, canDelete: false, canMerge: false } } };
export const ScheduledForDeletion: Story = { args: { sandbox: scheduled } };
export const Restoring: Story = { args: { sandbox: scheduled, restoring: true } };
export const RestoreNotAuthorized: Story = { args: { sandbox: { ...scheduled, canCancelDeletion: false } } };
/** The plan's limit stops a restore. */
export const RestoreBlocked: Story = { args: { sandbox: scheduled, restoreBlockedReason: "Upgrade to restore more sandboxes" } };

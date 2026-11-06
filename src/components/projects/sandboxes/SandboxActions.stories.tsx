import type { Meta, StoryObj } from "@storybook/react";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { withRouter } from "@/stories/decorators";
import SandboxActions from "./SandboxActions";

const sandbox = storyWorkspace[1]!;

const meta: Meta<typeof SandboxActions> = {
  title: "Projects/Sandboxes/SandboxActions",
  component: SandboxActions,
  decorators: [withRouter],
  args: { sandbox, editHref: `/projects/p/sandboxes/${sandbox.id}/edit`, onMerge: () => {}, onDelete: () => {} },
};
export default meta;
type Story = StoryObj<typeof SandboxActions>;

/** Open the menu: Edit, Merge, and Delete last in red. */
export const Default: Story = {};
/** Open the menu: each item greyed with Lightning's reason. */
export const NotAuthorized: Story = { args: { sandbox: { ...sandbox, canEdit: false, canDelete: false, canMerge: false } } };

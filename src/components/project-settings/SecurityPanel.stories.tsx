import type { Meta, StoryObj } from "@storybook/react";
import SecurityPanel from "./SecurityPanel";
import { withRouter, withGrayPanel } from "../../stories/decorators";

const meta: Meta<typeof SecurityPanel> = {
  title: "Project settings/SecurityPanel",
  component: SecurityPanel,
  decorators: [withRouter, withGrayPanel],
  args: {
    security: { requiresMfa: false, canEditProject: true, canRequireMfa: true },
    parent: null,
    onSetRequiresMfa: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof SecurityPanel>;

export const Optional: Story = {};
export const Required: Story = { args: { security: { requiresMfa: true, canEditProject: true, canRequireMfa: true } } };
export const NoPermission: Story = { args: { security: { requiresMfa: false, canEditProject: false, canRequireMfa: false } } };
export const Sandbox: Story = { args: { parent: { name: "openhie-project", settingsHref: "/projects/p1/settings" } } };
/** The plan doesn't include required MFA: the switch is off and says why. */
export const PlanLimited: Story = { args: { security: { requiresMfa: false, canEditProject: true, canRequireMfa: false } } };

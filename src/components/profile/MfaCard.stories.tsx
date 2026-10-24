import type { Meta, StoryObj } from "@storybook/react";
import MfaCard from "./MfaCard";
import { fakeMfaSetup } from "../../mock-data/profile";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof MfaCard> = {
  title: "Profile/MfaCard",
  component: MfaCard,
  decorators: [withRouter],
  args: {
    mfa: { enabled: false, backupCodesHref: "/profile/auth/backup_codes" },
    onStartSetup: async () => fakeMfaSetup,
    onConfirm: async () => {},
    onDisable: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof MfaCard>;

export const Disabled: Story = {};
export const Enabled: Story = { args: { mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } } };

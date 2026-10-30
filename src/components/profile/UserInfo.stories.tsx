import type { Meta, StoryObj } from "@storybook/react";
import UserInfo from "./UserInfo";
import { profilePropsFor } from "../../mock-data/profile";
import { session } from "../../mock-data/users";
import { withWhitePanel } from "../../stories/decorators";

const user = profilePropsFor(session.user).user;

const meta: Meta<typeof UserInfo> = { title: "Profile/UserInfo", component: UserInfo, args: { user } };
export default meta;
type Story = StoryObj<typeof UserInfo>;

export const Default: Story = {};
/** A long name and unspaced email in the narrow profile column, to check they wrap. */
export const LongValues: Story = {
  decorators: [withWhitePanel("w-64")],
  args: {
    user: {
      ...user,
      firstName: "Amelia-Oluwaseun-Alexandrina",
      lastName: "Van-Der-Westhuizen-Montgomery-Okonkwo",
      email: "amelia.oluwaseun-van-der-westhuizen.health-informatics@ministry-of-health.example.org",
    },
  },
};

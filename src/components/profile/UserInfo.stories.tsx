import type { Meta, StoryObj } from "@storybook/react";
import UserInfo from "./UserInfo";
import { profilePropsFor } from "../../mock-data/profile";
import { session } from "../../mock-data/users";

const meta: Meta<typeof UserInfo> = { title: "Profile/UserInfo", component: UserInfo, args: { user: profilePropsFor(session.user).user } };
export default meta;
export const Default: StoryObj<typeof UserInfo> = {};

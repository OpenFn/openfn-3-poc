import type { Meta, StoryObj } from "@storybook/react";
import MfaDisabledNotice from "./MfaDisabledNotice";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof MfaDisabledNotice> = { title: "Profile/MfaDisabledNotice", component: MfaDisabledNotice, decorators: [withRouter], args: { profileHref: "/profile" } };
export default meta;
export const Default: StoryObj<typeof MfaDisabledNotice> = {};

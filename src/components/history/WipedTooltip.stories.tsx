import type { Meta, StoryObj } from "@storybook/react";
import IconButton from "../primitives/IconButton";
import { withRouter } from "../../stories/decorators";
import WipedTooltip from "./WipedTooltip";
import { zeroPersistenceMessage } from "./runHelpers";

const meta = {
  title: "History/WipedTooltip",
  component: WipedTooltip,
  decorators: [withRouter],
  args: {
    message: zeroPersistenceMessage,
    dataStorageHref: "/projects/p/settings#data-storage",
    children: <IconButton icon="hero-arrow-path-mini" label="Retry (run from the start)" tooltip={false} disabled />,
  },
} satisfies Meta<typeof WipedTooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CanChangePolicy: Story = {};
export const ContactAdmins: Story = { args: { dataStorageHref: null } };

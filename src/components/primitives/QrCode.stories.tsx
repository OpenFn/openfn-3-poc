import type { Meta, StoryObj } from "@storybook/react";
import QrCode from "./QrCode";

const meta: Meta<typeof QrCode> = {
  title: "Primitives/QrCode",
  component: QrCode,
  args: { value: "otpauth://totp/OpenFn:amy@example.org?secret=DEMOFAKESECRETNOTREAL234&issuer=OpenFn", label: "QR code for your authenticator app" },
};
export default meta;
type Story = StoryObj<typeof QrCode>;

export const Default: Story = {};

/** No value draws nothing, rather than failing. */
export const Empty: Story = { args: { value: "" } };

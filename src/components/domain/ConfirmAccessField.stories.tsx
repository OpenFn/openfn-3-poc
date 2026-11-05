import type { Meta, StoryObj } from "@storybook/react";
import ConfirmAccessField from "./ConfirmAccessField";

const meta: Meta<typeof ConfirmAccessField> = {
  title: "Domain/ConfirmAccessField",
  component: ConfirmAccessField,
  args: { method: "password" },
};
export default meta;
type Story = StoryObj<typeof ConfirmAccessField>;

export const Password: Story = {};
export const AuthenticatorCode: Story = { args: { method: "totp" } };
export const Refused: Story = { args: { errors: ["Invalid password! Try again."] } };

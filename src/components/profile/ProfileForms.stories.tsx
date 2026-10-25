import type { Meta, StoryObj } from "@storybook/react";
import { BasicInfoForm, ChangeEmailForm, ChangePasswordForm } from "./ProfileForms";

const meta: Meta = { title: "Profile/ProfileForms" };
export default meta;
type Story = StoryObj;

const done = async () => {};

export const BasicInfo: Story = {
  render: () => <BasicInfoForm values={{ firstName: "Amy", lastName: "Admin", contactPreference: "critical" }} onSave={done} />,
};
export const ChangeEmail: Story = { render: () => <ChangeEmailForm onSubmit={done} /> };
export const ChangePassword: Story = { render: () => <ChangePasswordForm onSubmit={done} /> };

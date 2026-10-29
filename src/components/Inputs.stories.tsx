import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox, Field, PasswordInput, Radio, Select, TextArea, TextInput } from "./Inputs";
import { controlClasses } from "./controlClasses";

const meta: Meta = { title: "Shared/Inputs" };
export default meta;
type Story = StoryObj;

export const Text: Story = { render: () => <TextInput id="email" label="Email" required placeholder="you@example.org" /> };
export const TextWithHint: Story = {
  render: () => <TextInput id="name" label="Name" hint="Lowercase letters, numbers and dashes." placeholder="my-project" />,
};
export const TextWithError: Story = {
  render: () => <TextInput id="name" label="Name" defaultValue="" errors={["can't be blank"]} />,
};
export const Disabled: Story = { render: () => <TextInput id="id" label="Project ID" value="4adf2644" disabled readOnly /> };
export const Password: Story = { render: () => <PasswordInput id="password" label="Password" required /> };
export const PasswordWithError: Story = {
  render: () => <PasswordInput id="password" label="Password" errors={["should be at least 8 character(s)"]} defaultValue="short" />,
};
export const Area: Story = { render: () => <TextArea id="desc" label="Description" rows={3} /> };
export const Dropdown: Story = {
  render: () => <Select id="role" label="Role" options={["viewer", "editor", "admin", "owner"]} prompt="Choose a role" value="" />,
};
export const DropdownWithObjects: Story = {
  render: () => (
    <Select
      id="adaptor"
      label="Adaptor"
      value="@openfn/language-http"
      options={[
        { label: "HTTP", value: "@openfn/language-http" },
        { label: "DHIS2", value: "@openfn/language-dhis2" },
      ]}
    />
  ),
};
/** Controlled, as pages use it: the chosen option is ticked. */
export const DropdownChosen: Story = {
  render: function Render() {
    const [role, setRole] = useState("editor");
    return <Select id="role" label="Role" options={["viewer", "editor", "admin", "owner"]} value={role} onChange={(e) => setRole(e.target.value)} />;
  },
};
/** A value that matches no option shows the prompt and ticks nothing. */
export const DropdownNoMatch: Story = {
  render: () => <Select id="role" label="Role" options={["viewer", "editor"]} prompt="Choose a role" value="owner" />,
};
export const DropdownEmpty: Story = {
  render: () => <Select id="target" label="Target project" options={[]} prompt="Select a project" value="" />,
};
export const DropdownWithError: Story = {
  render: () => <Select id="project" label="Project" required options={["openhie", "dhis2"]} prompt="Select a project" value="" errors={["can't be blank"]} />,
};
export const DropdownDisabled: Story = {
  render: () => <Select id="period" label="History Retention Period" options={["7 Days", "30 Days"]} value="30 Days" disabled />,
};
/** No visible label: `aria-label` names it. */
export const DropdownWithoutLabel: Story = {
  render: () => <Select id="digest" aria-label="Digest" options={["Never", "Daily", "Weekly"]} value="Weekly" fieldClassName="w-32" />,
};
export const Check: Story = { render: () => <Checkbox label="Remember me" defaultChecked /> };
export const CheckWithHint: Story = {
  render: () => <Checkbox label="Require MFA" hint="Collaborators must set up two-factor authentication." />,
};
export const Radios: Story = {
  render: () => (
    <div className="space-y-2">
      <Radio name="auth" label="Basic" defaultChecked />
      <Radio name="auth" label="API key" />
    </div>
  ),
};
export const CustomControlInField: Story = {
  render: () => (
    <Field id="when" label="Run after" hint="Pick a date and time.">
      <input id="when" type="datetime-local" data-ui="field" className={controlClasses()} />
    </Field>
  ),
};
export const Indeterminate: Story = { render: () => <Checkbox label="Select all work orders" indeterminate /> };
/** `fieldClassName` styles the field wrapper, so inputs can share a flex row. */
export const GrowInRow: Story = {
  render: () => (
    <div className="flex items-end gap-2">
      <TextInput id="first" label="First name" fieldClassName="flex-1" />
      <TextInput id="last" label="Last name" fieldClassName="flex-1" />
      <Select id="role" label="Role" options={["viewer", "editor", "admin"]} value="viewer" fieldClassName="w-40" />
    </div>
  ),
};

import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Checkbox, Field, PasswordInput, Radio, Select, TextArea, TextInput } from "./Inputs";
import { controlClasses } from "./controlClasses";
import { useFieldControl } from "./fieldControl";
import Pill from "./Pill";
import TextLink from "./TextLink";

/** The text field takes the controls; the other stories show one control each and turn the panel off. */
const meta: Meta<typeof TextInput> = {
  title: "Primitives/Inputs",
  component: TextInput,
  args: { id: "name", label: "Name", required: false, disabled: false },
  argTypes: {
    label: { control: "text" },
    hint: { control: "text" },
    info: { control: "text" },
    errors: { control: "object" },
    aside: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof TextInput>;
const noControls = { controls: { disable: true } };

export const Text: Story = { args: { id: "email", label: "Email", required: true, placeholder: "you@example.org" } };
export const TextWithHint: Story = { args: { hint: "Lowercase letters, numbers and dashes.", placeholder: "my-project" } };
export const TextWithError: Story = { args: { errors: ["can't be blank"] } };
/** A typed value with an error: the text turns red as well as the border. */
export const TypedWithError: Story = { args: { id: "email", label: "Email", defaultValue: "not-an-email", errors: ["must be a valid email address"] } };
/** `info` puts a tooltip after the label and its star. */
export const WithInfo: Story = {
  args: { id: "env", label: "Environment name", required: true, info: "Environment names let a workflow pick the right credential values." },
};
/** `aside` sits at the right end of the label row: a link that acts on the field, or a badge. */
export const WithAside: Story = {
  parameters: noControls,
  render: () => (
    <div className="space-y-6">
      <TextArea id="ai" label="Build with AI" aside={<Pill tone="success">Recommended</Pill>} rows={3} />
      <TextInput id="cred" label="Credentials" aside={<TextLink>New Credential</TextLink>} />
    </div>
  ),
};
export const Disabled: Story = { args: { id: "id", label: "Project ID", value: "4adf2644", disabled: true, readOnly: true } };
export const Password: Story = { parameters: noControls, render: () => <PasswordInput id="password" label="Password" required /> };
export const PasswordWithError: Story = {
  parameters: noControls,
  render: () => <PasswordInput id="password" label="Password" errors={["should be at least 8 character(s)"]} defaultValue="short" />,
};
export const Area: Story = { parameters: noControls, render: () => <TextArea id="desc" label="Description" rows={3} /> };
export const Dropdown: Story = {
  parameters: noControls,
  render: () => <Select id="role" label="Role" options={["viewer", "editor", "admin", "owner"]} prompt="Choose a role" value="" />,
};
export const DropdownWithObjects: Story = {
  parameters: noControls,
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
  parameters: noControls,
  render: function Render() {
    const [role, setRole] = useState("editor");
    return <Select id="role" label="Role" options={["viewer", "editor", "admin", "owner"]} value={role} onChange={(e) => setRole(e.target.value)} />;
  },
};
/** A value that matches no option shows the prompt and ticks nothing. */
export const DropdownNoMatch: Story = {
  parameters: noControls,
  render: () => <Select id="role" label="Role" options={["viewer", "editor"]} prompt="Choose a role" value="owner" />,
};
export const DropdownEmpty: Story = {
  parameters: noControls,
  render: () => <Select id="target" label="Target project" options={[]} prompt="Select a project" value="" />,
};
export const DropdownWithError: Story = {
  parameters: noControls,
  render: () => <Select id="project" label="Project" required options={["openhie", "dhis2"]} prompt="Select a project" value="" errors={["can't be blank"]} />,
};
export const DropdownDisabled: Story = {
  parameters: noControls,
  render: () => <Select id="period" label="History Retention Period" options={["7 Days", "30 Days"]} value="30 Days" disabled />,
};
/** No visible label: `aria-label` names it. */
export const DropdownWithoutLabel: Story = {
  parameters: noControls,
  render: () => <Select id="digest" aria-label="Digest" options={["Never", "Daily", "Weekly"]} value="Weekly" fieldClassName="w-32" />,
};
export const Check: Story = { parameters: noControls, render: () => <Checkbox label="Remember me" defaultChecked /> };
export const CheckWithHint: Story = {
  parameters: noControls,
  render: () => <Checkbox label="Require MFA" hint="Collaborators must set up two-factor authentication." />,
};
export const CheckDisabled: Story = { parameters: noControls, render: () => <Checkbox label="Make client global" disabled defaultChecked /> };
export const CheckWithError: Story = {
  parameters: noControls,
  render: () => (
    <Field errors={["must be accepted"]}>
      <Checkbox label="I agree to the terms" />
    </Field>
  ),
};
export const Radios: Story = {
  parameters: noControls,
  render: () => (
    <div className="space-y-2">
      <Radio name="auth" label="Basic" defaultChecked />
      <Radio name="auth" label="API key" />
    </div>
  ),
};
/** `group` makes a fieldset named by the label; its errors mark every radio. */
export const RadioGroup: Story = {
  parameters: noControls,
  render: () => (
    <Field group label="Response" hint="When the webhook answers the caller." errors={["can't be blank"]}>
      <div className="space-y-2">
        <Radio name="reply" label="Immediately" />
        <Radio name="reply" label="After the run completes" />
      </div>
    </Field>
  ),
};
/** A disabled group disables every control in it and dims its text. */
export const RadioGroupDisabled: Story = {
  parameters: noControls,
  render: () => (
    <Field group label="Input/Output Data Storage Policy" hint="Only owners can change this." disabled>
      <div className="space-y-2">
        <Radio name="policy" label="Retain all input/output data" defaultChecked />
        <Radio name="policy" label="Never retain input/output data (zero-persistence)" />
      </div>
    </Field>
  ),
};
function DateTimeControl() {
  return <input type="datetime-local" data-ui="field" className={controlClasses()} {...useFieldControl()} />;
}
/** A custom control takes its id, hint and error from the Field with `useFieldControl`. */
export const CustomControlInField: Story = {
  parameters: noControls,
  render: () => (
    <Field id="when" label="Run after" hint="Pick a date and time." errors={["must be in the future"]}>
      <DateTimeControl />
    </Field>
  ),
};
export const Indeterminate: Story = { parameters: noControls, render: () => <Checkbox label="Select all work orders" indeterminate /> };
/** `fieldClassName` styles the field wrapper, so inputs can share a flex row. */
export const GrowInRow: Story = {
  parameters: noControls,
  render: () => (
    <div className="flex items-end gap-2">
      <TextInput id="first" label="First name" fieldClassName="flex-1" />
      <TextInput id="last" label="Last name" fieldClassName="flex-1" />
      <Select id="role" label="Role" options={["viewer", "editor", "admin"]} value="viewer" fieldClassName="w-40" />
    </div>
  ),
};
export const AreaWithError: Story = {
  render: () => <TextArea id="desc" label="Description" rows={3} defaultValue="x" errors={["should be at most 240 character(s)"]} />,
};
export const AreaDisabled: Story = {
  render: () => <TextArea id="desc" label="Description" rows={3} value="Syncs facilities from DHIS2." disabled readOnly />,
};
export const PasswordDisabled: Story = { render: () => <PasswordInput id="password" label="Password" disabled /> };
export const RadiosDisabled: Story = {
  render: () => (
    <div className="space-y-2">
      <Radio name="auth-disabled" label="Basic" defaultChecked disabled />
      <Radio name="auth-disabled" label="API key" disabled />
    </div>
  ),
};

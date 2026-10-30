import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";
import Form from "./Form";
import { TextInput } from "./Inputs";
import { withWhitePanel } from "../../stories/decorators";

const meta: Meta<typeof Form> = {
  title: "Primitives/Form",
  component: Form,
  decorators: [withWhitePanel()],
  args: {
    onSubmit: (e) => e.preventDefault(),
    actions: <Button type="submit">Save</Button>,
    children: (
      <>
        <TextInput id="first" label="First name" required defaultValue="Amy" />
        <TextInput id="last" label="Last name" required defaultValue="Admin" />
      </>
    ),
  },
};
export default meta;
type Story = StoryObj<typeof Form>;

export const SaveOnly: Story = {};
export const WithCancel: Story = {
  args: {
    actions: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button type="submit">Save</Button>
      </>
    ),
  },
};
/** A failure for the whole form sits above the buttons. */
export const WithError: Story = { args: { error: new Error("Something went wrong. Please try again.") } };
export const Saving: Story = { args: { pending: true, actions: <Button type="submit" pending>Save</Button> } };

import type { Meta, StoryObj } from "@storybook/react";
import AuthPanelLayout, { AuthPanel, HavingProblems } from "./AuthPanelLayout";
import Button from "../primitives/Button";
import { TextInput } from "../primitives/Inputs";
import TextLink from "../primitives/TextLink";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof AuthPanelLayout> = {
  title: "Auth/AuthPanelLayout",
  component: AuthPanelLayout,
  decorators: [withRouter],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj<typeof AuthPanelLayout>;

const panels = (
  <>
    <AuthPanel>
      <TextInput
        id="code"
        label="Authentication Code"
        hint="Open your two-factor authenticator (TOTP) app or browser extension to view your authentication code."
        placeholder="XXXXXX"
      />
      <Button className="w-full">Verify</Button>
    </AuthPanel>
    <HavingProblems>
      <li>
        <TextLink to="#">Use your backup code</TextLink>
      </li>
    </HavingProblems>
  </>
);

export const Centered: Story = { args: { title: "Two-factor authentication", children: panels } };
export const Top: Story = {
  args: {
    title: "Confirm your email address",
    align: "top",
    children: (
      <AuthPanel>
        <p className="text-sm text-muted">Panel</p>
      </AuthPanel>
    ),
  },
};

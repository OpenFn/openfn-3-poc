import type { Meta, StoryObj } from "@storybook/react";
import WebhookAuthMethodFormModal from "./WebhookAuthMethodFormModal";
import { generateApiKey, projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { authMethods } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).webhookSecurity;

const meta: Meta<typeof WebhookAuthMethodFormModal> = {
  title: "Project settings/WebhookAuthMethodFormModal",
  component: WebhookAuthMethodFormModal,
  args: { onCancel: () => {}, onSave: async () => {}, onGenerateApiKey: async () => generateApiKey() },
};
export default meta;
type Story = StoryObj<typeof WebhookAuthMethodFormModal>;

export const ChooseType: Story = {};
export const ViewBasic: Story = { args: { authMethod: authMethods[0], onReveal: async () => "fixture-password" } };
export const ViewApiKey: Story = { args: { authMethod: authMethods[1], onReveal: async () => "fixture0000000000000000000000000000key01" } };

const tick = () => new Promise((r) => setTimeout(r));
const click = (doc: Document, selector: string) => doc.querySelector<HTMLElement>(selector)?.click();
const clickButton = (doc: Document, text: string) => [...doc.querySelectorAll("button")].find((b) => b.textContent === text)?.click();

/** Picks the nth type on the first step and goes on to its form. */
const choose =
  (n: number): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    doc.querySelectorAll<HTMLInputElement>('input[name="auth_type"]')[n]!.click();
    await tick();
    clickButton(doc, "Next");
  };

export const CreateBasic: Story = { play: choose(0) };
/** The host has generated the key, shown before the method is created. */
export const CreateApiKey: Story = { play: choose(1) };

/** "Show" asks for the password or a 2FA code first. */
export const Reauthenticate: Story = {
  args: ViewBasic.args!,
  play: async ({ canvasElement }) => click(canvasElement.ownerDocument, "#webhook_auth_method_password_action_button"),
};

/** A wrong password: the step stays open with the host's message. */
export const ReauthFailed: Story = {
  args: { ...ViewBasic.args, onReveal: () => Promise.reject(new Error("Invalid password. Try again.")) },
  play: async (context) => {
    await Reauthenticate.play!(context);
    await tick();
    click(context.canvasElement.ownerDocument, 'button[form="reauthentication-form"]');
  },
};

/** A failed save keeps the form open with the message. */
export const SaveFailed: Story = {
  args: { ...ViewBasic.args, onSave: () => Promise.reject(new Error("The server could not complete that request.")) },
  play: async ({ canvasElement }) => click(canvasElement.ownerDocument, 'button[type="submit"]'),
};

import type { Meta, StoryObj } from "@storybook/react";
import AuthProviderForm from "./AuthProviderForm";
import { authProvider, emptyAuthProvider } from "../../mock-data/admin";

const resolve = async () => {};

const meta: Meta<typeof AuthProviderForm> = {
  title: "Admin/AuthProviderForm",
  component: AuthProviderForm,
  args: { provider: emptyAuthProvider, onSave: resolve, onTest: resolve, onRemove: resolve },
};
export default meta;
type Story = StoryObj<typeof AuthProviderForm>;

export const New: Story = {};
export const Existing: Story = { args: { provider: authProvider ?? emptyAuthProvider } };
export const TestSucceeded: Story = { args: { provider: authProvider ?? emptyAuthProvider, initialTestState: "success" } };
export const TestFailed: Story = { args: { provider: authProvider ?? emptyAuthProvider, initialTestState: "failed" } };

const existing = authProvider ?? emptyAuthProvider;
const click =
  (selector: string): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>(selector)?.click();
  };
const submit = click('button[type="submit"]');

/** Save pressed with a bad name and URL and the rest blank: each field says why. */
export const InvalidFields: Story = {
  args: { provider: { ...emptyAuthProvider, name: "My Provider", discoveryUrl: "not-a-url" } },
  play: submit,
};

/** The host refuses the save with a message. */
export const SaveRefused: Story = {
  args: { provider: existing, onSave: () => Promise.reject(new Error("The provider could not be saved.")) },
  play: submit,
};

/** The host refuses Remove: the reason shows above the button. */
export const RemoveFailed: Story = {
  args: { provider: existing, onRemove: () => Promise.reject(new Error("The provider could not be removed.")) },
  play: async ({ canvasElement }) => {
    [...canvasElement.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Remove")?.click();
  },
};

/** Save is still out: the button shows pending. */
export const SavePending: Story = { args: { provider: existing, onSave: () => new Promise(() => {}) }, play: submit };

/** Test is still out: the button shows pending. */
export const TestPending: Story = {
  args: { provider: existing, onTest: () => new Promise(() => {}) },
  play: click("#test-button"),
};

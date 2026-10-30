import type { Meta, StoryObj } from "@storybook/react";
import { BasicInfoForm, ChangeEmailForm, ChangePasswordForm } from "./ProfileForms";
import { RequestError } from "../../utils/errors";

const meta: Meta = { title: "Profile/ProfileForms" };
export default meta;
type Story = StoryObj;

const done = async () => {};
const never = () => new Promise<void>(() => {});
const refuse = (message: string) => () => Promise.reject(new Error(message));
const wrongPassword = () =>
  Promise.reject(new RequestError("invalid", { fieldErrors: { currentPassword: ["is not valid"] } }));

/** Types each value into the form's inputs in order, then presses its submit button. */
const fillAndSubmit =
  (formId: string, values: string[]): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const inputs = canvasElement.querySelectorAll<HTMLInputElement>(`#${formId} input:not([type="hidden"])`);
    values.forEach((value, i) => {
      const input = inputs[i]!;
      // Set the value the way a keystroke does, so React's onChange sees it.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r));
    canvasElement.querySelector<HTMLButtonElement>(`#${formId} button[type="submit"]`)?.click();
  };

const basicValues = { firstName: "Amy", lastName: "Admin", contactPreference: "critical" as const };
const basic = (onSave: () => Promise<void>) => () => <BasicInfoForm values={basicValues} onSave={onSave} />;
const renamed = fillAndSubmit("basic-info-form", ["Amelia"]);

export const BasicInfo: Story = { render: basic(done) };
/** A name changed: Save is enabled. */
export const BasicInfoDirty: Story = {
  render: basic(done),
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("#basic-info-form input")!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "Amelia");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  },
};
/** First name cleared and saved: the field says why. */
export const BasicInfoFieldErrors: Story = { render: basic(done), play: fillAndSubmit("basic-info-form", [""]) };
export const BasicInfoServerError: Story = { render: basic(refuse("Your details could not be saved.")), play: renamed };
export const BasicInfoSaving: Story = { render: basic(never), play: renamed };

const email = (onSubmit: () => Promise<void>) => () => <ChangeEmailForm onSubmit={onSubmit} />;
const emailFilled = fillAndSubmit("email-form", ["amy.new@openfn.org", "a-password"]);

export const ChangeEmail: Story = { render: email(done) };
/** Submitted empty: each field says why. */
export const ChangeEmailFieldErrors: Story = { render: email(done), play: fillAndSubmit("email-form", []) };
/** The host refuses the password. */
export const ChangeEmailServerError: Story = { render: email(wrongPassword), play: emailFilled };
export const ChangeEmailSaving: Story = { render: email(never), play: emailFilled };

const password = (onSubmit: () => Promise<void>) => () => <ChangePasswordForm onSubmit={onSubmit} />;
const passwordFilled = fillAndSubmit("password-form", ["a-new-long-password", "a-new-long-password", "a-password"]);

export const ChangePassword: Story = { render: password(done) };
/** A short password that doesn't match its confirmation: each field says why. */
export const ChangePasswordFieldErrors: Story = { render: password(done), play: fillAndSubmit("password-form", ["short", "shorter"]) };
/** The host refuses the current password. */
export const ChangePasswordServerError: Story = { render: password(wrongPassword), play: passwordFilled };
export const ChangePasswordSaving: Story = { render: password(never), play: passwordFilled };

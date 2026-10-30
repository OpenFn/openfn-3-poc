import type { SubmitEvent, ReactNode } from "react";
import Button from "../primitives/Button";
import Card from "../primitives/Card";
import Form from "../primitives/Form";
import { PasswordInput, Select, TextInput } from "../primitives/Inputs";
import type { BasicInfoValues, ChangeEmailValues, ChangePasswordValues } from "../../types/profile";
import { contactPreferenceHint, contactPreferenceOptions } from "../../constants";
import { useForm } from "../../utils/useForm";
import { blank, isValidEmail } from "../../utils/validate";

/**
 * The three forms of ProfileLive.FormComponent (profile_live/form_component.html.heex),
 * each its own card. Each form hands its values to its `on*` action; a refusal
 * puts field errors on the fields, and any other failure shows in the card.
 */

function FormCard({
  id,
  title,
  onSubmit,
  error,
  pending,
  children,
  button,
}: {
  id: string;
  title: string;
  onSubmit: (e: SubmitEvent) => void;
  error: Error | null;
  pending: boolean;
  children: ReactNode;
  button: ReactNode;
}) {
  return (
    <Card padding="lg" title={title} annotation="profile-account">
      <Form id={id} onSubmit={onSubmit} error={error} pending={pending} actions={button}>
        {children}
      </Form>
    </Card>
  );
}

export function BasicInfoForm({ values, onSave }: { values: BasicInfoValues; onSave: (values: BasicInfoValues) => Promise<void> }) {
  const form = useForm<BasicInfoValues>({
    initial: values,
    validate: ({ firstName, lastName }) => ({ firstName: blank(firstName), lastName: blank(lastName) }),
  });
  return (
    <FormCard
      id="basic-info-form"
      title="Change basic information"
      {...form.formProps(onSave)}
      button={
        <Button type="submit" disabled={!form.dirty} tooltip={form.dirty ? undefined : "No changes to save"}>
          Save
        </Button>
      }
    >
      <TextInput label="First name" required autoComplete="given-name" {...form.fieldProps("firstName")} />
      <TextInput label="Last name" required autoComplete="family-name" {...form.fieldProps("lastName")} />
      <Select
        label="Contact preference"
        required
        hint={contactPreferenceHint}
        options={contactPreferenceOptions}
        {...form.fieldProps("contactPreference")}
      />
    </FormCard>
  );
}

export function ChangeEmailForm({ onSubmit }: { onSubmit: (values: ChangeEmailValues) => Promise<void> }) {
  const form = useForm<ChangeEmailValues>({
    initial: { email: "", currentPassword: "" },
    validate: ({ email, currentPassword }) => ({
      email: email.trim() && !isValidEmail(email) ? ["must be a valid email address"] : blank(email),
      currentPassword: blank(currentPassword),
    }),
    clearOnSave: true,
  });
  return (
    <FormCard
      id="email-form"
      title="Change email"
      {...form.formProps(onSubmit)}
      button={
        <Button type="submit">
          Update email
        </Button>
      }
    >
      <TextInput label="New email address" required {...form.fieldProps("email")} />
      <PasswordInput label="Enter password to confirm" required autoComplete="current-password" {...form.fieldProps("currentPassword")} />
    </FormCard>
  );
}

export function ChangePasswordForm({ onSubmit }: { onSubmit: (values: ChangePasswordValues) => Promise<void> }) {
  const form = useForm<ChangePasswordValues>({
    initial: { password: "", passwordConfirmation: "", currentPassword: "" },
    validate: ({ password, passwordConfirmation, currentPassword }) => ({
      password: password.trim() && password.length < 12 ? ["should be at least 12 character(s)"] : blank(password),
      passwordConfirmation: passwordConfirmation !== password ? ["does not match password"] : [],
      currentPassword: blank(currentPassword),
    }),
    clearOnSave: true,
  });
  return (
    <FormCard
      id="password-form"
      title="Change password"
      {...form.formProps(onSubmit)}
      button={
        <Button type="submit">
          Update password
        </Button>
      }
    >
      <PasswordInput label="New password" required autoComplete="new-password" {...form.fieldProps("password")} />
      <PasswordInput label="Confirm new password" required autoComplete="new-password" {...form.fieldProps("passwordConfirmation")} />
      <PasswordInput label="Current password" required autoComplete="current-password" {...form.fieldProps("currentPassword")} />
    </FormCard>
  );
}

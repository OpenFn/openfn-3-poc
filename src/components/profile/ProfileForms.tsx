import type { FormEvent, ReactNode } from "react";
import Alert from "../Alert";
import Button from "../Button";
import Card from "../Card";
import InfoTooltip from "../InfoTooltip";
import { PasswordInput, Select, TextInput } from "../Inputs";
import type { BasicInfoValues, ChangeEmailValues, ChangePasswordValues } from "../../types/profile";
import { contactPreferenceOptions, contactPreferenceTooltip } from "../../constants";
import { errorMessage } from "../../utils/errors";
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
  children,
  button,
}: {
  id: string;
  title: string;
  onSubmit: (e: FormEvent) => void;
  error: Error | null;
  children: ReactNode;
  button: ReactNode;
}) {
  return (
    <form id={id} onSubmit={onSubmit} data-annotation="profile-account">
      <Card padding="lg" title={title} className="space-y-6">
        {children}
        {error && <Alert type="danger">{errorMessage(error)}</Alert>}
        {button}
      </Card>
    </form>
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
      onSubmit={form.submit(onSave)}
      error={form.error}
      button={
        <Button type="submit" disabled={!form.dirty} pending={form.pending}>
          Save
        </Button>
      }
    >
      <TextInput label="First name" required autoComplete="given-name" {...form.fieldProps("firstName")} />
      <TextInput label="Last name" required autoComplete="family-name" {...form.fieldProps("lastName")} />
      <Select
        label={
          <>
            Contact preference<span className="text-red-500"> *</span>
            <InfoTooltip title={contactPreferenceTooltip} />
          </>
        }
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
      onSubmit={form.submit(onSubmit)}
      error={form.error}
      button={
        <Button type="submit" pending={form.pending}>
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
      onSubmit={form.submit(onSubmit)}
      error={form.error}
      button={
        <Button type="submit" pending={form.pending}>
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

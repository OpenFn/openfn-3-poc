import { useState } from "react";
import { superuserReach, userRoleOptions } from "@/constants";
import type { AdminUserEditing, AdminUserRow, UserFormValues } from "@/types/admin";
import { fullName } from "@/utils/format";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import Alert from "@/components/primitives/Alert";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import FormModal from "@/components/primitives/FormModal";
import { Checkbox, Field, PasswordInput, Select, TextInput } from "@/components/primitives/Inputs";
import TextLink from "@/components/primitives/TextLink";

interface Props {
  /** The account to edit; omit to create one. */
  editing?: AdminUserEditing;
  /** Your profile, where you change your own email and password. */
  profileHref: string;
  onCancel: () => void;
  /** Saves only the fields to send: no blank password, no Disabled on create, and only the names on your own account. Rejects with a message, or a 422's field errors keyed as the API keys them. */
  onSave: (values: Partial<UserFormValues>) => Promise<void>;
}

const valuesOf = (user: AdminUserRow | undefined): UserFormValues => ({
  first_name: user?.firstName ?? "",
  last_name: user?.lastName ?? "",
  email: user?.email ?? "",
  password: "",
  role: user?.role ?? "user",
  support_user: user?.supportUser ?? false,
  disabled: user?.disabled ?? false,
});

/**
 * A superuser creates an account or changes any account
 * (user_live/form_component.html.heex): names, email, a password, role,
 * support access and, on edit, disabled. The client checks only for blanks;
 * the server checks the rest, and its field errors land on their fields.
 */
export default function UserFormModal({ editing, profileHref, onCancel, onSave }: Props) {
  const user = editing?.user;
  const status = editing?.status ?? { state: "ready" };
  const ownAccount = editing?.ownAccount ?? false;
  const form = useForm<UserFormValues>({
    initial: valuesOf(user),
    validate: (v) => ({
      first_name: blank(v.first_name),
      last_name: blank(v.last_name),
      email: blank(v.email),
      password: editing ? [] : blank(v.password),
    }),
  });
  // An account loads after its modal opens: the form starts from it once it's there. Keying the modal on the account
  // instead would close and reopen the dialog.
  const [startedFrom, setStartedFrom] = useState(user?.id);
  if (user && user.id !== startedFrom) {
    setStartedFrom(user.id);
    form.reset(valuesOf(user));
  }
  const { values } = form;

  return (
    <FormModal
      open
      onClose={onCancel}
      title={!editing ? "New user" : user ? `Edit ${fullName(user)}` : "Edit user"}
      formId="user-form"
      submitId="save-user"
      submitLabel={editing ? "Save" : "Create user"}
      submitDisabled={status.state !== "ready"}
      errorHeader="The account wasn't saved"
      onSubmit={form.modalSubmit(async ({ password, disabled, ...rest }) => {
        if (ownAccount) await onSave({ first_name: rest.first_name, last_name: rest.last_name });
        else await onSave({ ...rest, ...(editing ? { disabled } : {}), ...(password ? { password } : {}) });
      })}
    >
      <AsyncBoundary status={status}>
        <TextInput id="user_first_name" label="First name" required autoComplete={ownAccount ? "given-name" : undefined} {...form.fieldProps("first_name")} />
        <TextInput id="user_last_name" label="Last name" required autoComplete={ownAccount ? "family-name" : undefined} {...form.fieldProps("last_name")} />
        <TextInput
          id="user_email"
          type="email"
          label="Email"
          required={!ownAccount}
          disabled={ownAccount}
          hint={ownAccount && (
            <>
              Change your own email and password in <TextLink to={profileHref}>your profile</TextLink>.
            </>
          )}
          {...form.fieldProps("email")}
        />
        {!ownAccount && (
          <PasswordInput
            id="user_password"
            label="Password"
            required={!editing}
            autoComplete="new-password"
            hint={editing ? "Leave blank to keep their current password." : "They can change it once they've logged in."}
            {...form.fieldProps("password")}
          />
        )}
        <Select
          id="user_role"
          label="Role"
          options={userRoleOptions}
          disabled={ownAccount}
          hint={ownAccount ? "You can't change your own role." : superuserReach}
          {...form.fieldProps("role")}
        />
        <Field errors={form.errors.support_user}>
          <Checkbox
            id="user_support_user"
            label="Support user"
            hint={ownAccount && "You can't change your own support access."}
            disabled={ownAccount}
            checked={values.support_user}
            onChange={(e) => form.set("support_user", e.target.checked)}
          />
        </Field>
        {values.support_user && (
          <Alert tone="warning" header="Heads up">
            This user will be able to open every project that has support access turned on.
          </Alert>
        )}
        {editing && (
          <Field errors={form.errors.disabled}>
            <Checkbox
              id="user_disabled"
              label="Disabled"
              hint={ownAccount ? "You can't disable your own account." : "A disabled user can't log in."}
              disabled={ownAccount}
              checked={values.disabled}
              onChange={(e) => form.set("disabled", e.target.checked)}
            />
          </Field>
        )}
      </AsyncBoundary>
    </FormModal>
  );
}

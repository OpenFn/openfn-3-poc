import Header from "@/components/primitives/Header";
import Button from "@/components/primitives/Button";
import Form from "@/components/primitives/Form";
import { PasswordInput, TextInput } from "@/components/primitives/Inputs";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { Stack } from "@/components/primitives/Stack";
import type { FirstSetupValues } from "@/types/auth";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";

/** The contract between this page and whatever feeds it. */
export interface FirstSetupPageProps {
  /** Creates the superuser. Resolves when the host has signed them in and sent them on; rejects with field errors or a message. */
  onSave: (values: FirstSetupValues) => Promise<void>;
}

/**
 * Inventory view `first-setup` (first_setup_live/superuser.html.heex): the
 * form that creates the first superuser on a fresh install. The page checks
 * only for blanks and that the confirmation matches; the server checks the
 * rest, and its field errors show on their fields. Props only: the shell
 * around it is the host's.
 */
export default function FirstSetupPage({ onSave }: FirstSetupPageProps) {
  const form = useForm<FirstSetupValues>({
    initial: { first_name: "", last_name: "", email: "", password: "", passwordConfirmation: "" },
    validate: ({ first_name, last_name, email, password, passwordConfirmation }) => ({
      first_name: blank(first_name),
      last_name: blank(last_name),
      email: blank(email),
      password: blank(password),
      passwordConfirmation: passwordConfirmation === password ? [] : ["does not match confirmation"],
    }),
  });

  return (
    <PageContent header={<Header title="Setup" size="xl" />}>
      <Centered>
        <Stack>
          <p>
            Looks like this is a fresh install of OpenFn Lightning. Create a superuser account to manage projects and
            users.
          </p>
          <Form
            id="superuser-registration-form"
            {...form.formProps(onSave)}
            className="w-1/2"
            actions={
              <Button type="submit">
                Save
              </Button>
            }
          >
            <TextInput id="first_name" name="first_name" label="First name" autoComplete="given-name" {...form.fieldProps("first_name")} />
            <TextInput id="last_name" name="last_name" label="Last name" autoComplete="family-name" {...form.fieldProps("last_name")} />
            <TextInput id="email" name="email" type="email" label="Email" autoComplete="email" {...form.fieldProps("email")} />
            <PasswordInput id="password" name="password" label="Password" autoComplete="new-password" {...form.fieldProps("password")} />
            <PasswordInput
              id="password_confirmation"
              name="password_confirmation"
              label="Password confirmation"
              autoComplete="new-password"
              {...form.fieldProps("passwordConfirmation")}
            />
          </Form>
        </Stack>
      </Centered>
    </PageContent>
  );
}

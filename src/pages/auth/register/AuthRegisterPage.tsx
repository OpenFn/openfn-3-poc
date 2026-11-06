import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "@/components/auth/AuthCard";
import TextLink from "@/components/primitives/TextLink";
import Form from "@/components/primitives/Form";
import Button from "@/components/primitives/Button";
import { Checkbox, Field, PasswordInput, TextInput } from "@/components/primitives/Inputs";
import type { RegisterValues } from "@/types/auth";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";

/** The contract between this page and whatever feeds it. */
export interface AuthRegisterPageProps {
  /** Creates the account. Resolves when the host has signed them in and sent them on; rejects with field errors or a message. */
  onRegister: (values: RegisterValues) => Promise<void>;
}

/**
 * Inventory view `auth-register` (user_registration_html/new.html.heex). The
 * page checks only for blanks and the terms box; the server checks the rest,
 * and its field errors show on their fields. Whether sign-up is open is the
 * host's to decide.
 */
export default function AuthRegisterPage({ onRegister }: AuthRegisterPageProps) {
  const form = useForm<RegisterValues>({
    initial: { first_name: "", last_name: "", email: "", password: "", terms_accepted: false },
    // Lightning's User changeset wording.
    validate: ({ first_name, last_name, email, password, terms_accepted }) => ({
      first_name: blank(first_name),
      last_name: blank(last_name),
      email: blank(email),
      password: blank(password),
      terms_accepted: terms_accepted ? [] : ["Please accept the terms and conditions to register."],
    }),
  });

  return (
    <AuthLayout title="Register">
      <div id="register">
        <Form {...form.formProps(onRegister)}>
          <AuthCard>
            <TextInput id="user_first_name" label="First Name" required autoComplete="given-name" {...form.fieldProps("first_name")} />
            <TextInput id="user_last_name" label="Last Name" required autoComplete="family-name" {...form.fieldProps("last_name")} />
            <TextInput id="user_email" type="email" label="Email" required autoComplete="email" {...form.fieldProps("email")} />
            <PasswordInput id="user_password" label="Password" required autoComplete="new-password" {...form.fieldProps("password")} />
            <Field errors={form.errors.terms_accepted}>
              <Checkbox
                id="user_terms_accepted"
                required
                checked={form.values.terms_accepted}
                onChange={(e) => form.set("terms_accepted", e.target.checked)}
                label={<span className="font-medium">I accept the terms of service</span>}
                hint={
                  <>
                    Please check with the host of this instance of Lightning to ensure that you understand, accept, and
                    are willing to abide by all of their terms and conditions. You can read the OpenFn.org terms of
                    service{" "}
                    <TextLink to="https://www.openfn.org/terms" external>
                      here
                    </TextLink>
                    .
                  </>
                }
              />
            </Field>
            <Button type="submit">Register</Button>
            <AuthFooterLinks
              divider
              left={<TextLink variant="plain" to="/users/log_in">Log in</TextLink>}
              right={<TextLink variant="plain" to="/users/reset_password">Forgot your password?</TextLink>}
            />
          </AuthCard>
        </Form>
      </div>
    </AuthLayout>
  );
}

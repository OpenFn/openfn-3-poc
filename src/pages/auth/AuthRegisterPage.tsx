// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "../../components/auth/AuthCard";
import PlainTextResponse from "../../components/auth/PlainTextResponse";
import TextLink from "../../components/primitives/TextLink";
import Form from "../../components/primitives/Form";
import { useForm } from "../../utils/useForm";
import { blank, emailErrors } from "../../utils/validate";
import Button from "../../components/primitives/Button";
import { Checkbox, Field, PasswordInput, TextInput } from "../../components/primitives/Inputs";
// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { authFlags } from "../../mock-data/auth";
import { signupDisabledMessage } from "../../constants";

/**
 * Inventory view `auth-register` (user_registration_html/new.html.heex).
 * With `allowSignup` off (the default, as on demo.openfn.org) the router
 * answers with a bare text response; ?signup=1 shows the form.
 */
export default function AuthRegisterPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const flags = authFlags(search);
  const form = useForm({
    initial: { firstName: "", lastName: "", email: "", password: "", termsAccepted: false },
    // Lightning's User changeset wording.
    validate: ({ firstName, lastName, email, password, termsAccepted }) => ({
      firstName: blank(firstName),
      lastName: blank(lastName),
      email: emailErrors(email),
      password: blank(password),
      termsAccepted: termsAccepted ? [] : ["Please accept the terms and conditions to register."],
    }),
  });

  if (!flags.allowSignup) return <PlainTextResponse>{signupDisabledMessage}</PlainTextResponse>;


  return (
    <AuthLayout title="Register">
      <div id="register">
        <Form {...form.formProps(() => navigate("/projects"))}>
          <AuthCard>
            <TextInput id="user_first_name" label="First Name" required autoComplete="given-name" {...form.fieldProps("firstName")} />
            <TextInput id="user_last_name" label="Last Name" required autoComplete="family-name" {...form.fieldProps("lastName")} />
            <TextInput id="user_email" type="email" label="Email" required autoComplete="email" {...form.fieldProps("email")} />
            <PasswordInput id="user_password" label="Password" required autoComplete="new-password" {...form.fieldProps("password")} />
            <Field errors={form.errors.termsAccepted}>
              <Checkbox
                id="user_terms_accepted"
                required
                checked={form.values.termsAccepted}
                onChange={(e) => form.set("termsAccepted", e.target.checked)}
                label={<span className="font-medium">I accept the terms of service</span>}
                hint={
                  <>
                    Please check with the host of this instance of Lightning to ensure that you understand, accept, and
                    are willing to abide by all of their terms and conditions. You can read the OpenFn.org terms of
                    service{" "}
                    <TextLink href="https://www.openfn.org/terms" target="_blank">
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

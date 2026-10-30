// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "../../components/auth/AuthCard";
import Button from "../../components/primitives/Button";
import Form from "../../components/primitives/Form";
import { PasswordInput, TextInput } from "../../components/primitives/Inputs";
import { useForm } from "../../utils/useForm";
import { blank, emailErrors } from "../../utils/validate";
// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { authFlags } from "../../mock-data/auth";
import TextLink from "../../components/primitives/TextLink";

/**
 * Inventory view `auth-reset-password`.
 * /users/reset_password: request form (user_reset_password_html/new).
 * /users/reset_password/:token: set a new password (edit).
 * Lightning redirects after either submit (to /projects with a flash, and to
 * the login page); here both go to /users/log_in.
 */
export default function AuthResetPasswordPage() {
  const { token } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const flags = authFlags(search);
  const request = useForm({ initial: { email: "" }, validate: ({ email }) => ({ email: emailErrors(email) }) });
  // Lightning's User password changeset wording.
  const reset = useForm({
    initial: { password: "", confirmation: "" },
    validate: ({ password, confirmation }) => ({
      password: blank(password),
      confirmation: confirmation !== password ? ["does not match password"] : [],
    }),
  });
  const registerLink = flags.allowSignup && <TextLink variant="plain" to="/users/register">Register</TextLink>;

  if (!token) {
    return (
      <AuthLayout title="Forgot your password?">
        <div id="reset-password-new">
          <Form {...request.formProps(() => navigate("/users/log_in"))}>
            <AuthCard>
              <TextInput id="user_email" type="email" label="Email" required {...request.fieldProps("email")} />
              <Button type="submit">Send instructions to reset password</Button>
              <AuthFooterLinks left={<TextLink variant="plain" to="/users/log_in">Log in</TextLink>} right={registerLink} />
            </AuthCard>
          </Form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password">
      <div id="reset-password-edit">
        <Form {...reset.formProps(() => navigate("/users/log_in"))}>
          <AuthCard>
            <PasswordInput id="user_password" name="password" label="New password" required autoComplete="new-password" {...reset.fieldProps("password")} />
            <PasswordInput
              id="user_password_confirmation"
              name="password_confirmation"
              label="Confirm new password"
              required
              autoComplete="new-password"
              {...reset.fieldProps("confirmation")}
            />
            <Button type="submit">Reset password</Button>
            <AuthFooterLinks divider left={<TextLink variant="plain" to="/users/log_in">Log in</TextLink>} right={registerLink} />
          </AuthCard>
        </Form>
      </div>
    </AuthLayout>
  );
}

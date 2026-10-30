// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "../../components/auth/AuthCard";
import Button from "../../components/primitives/Button";
import Form from "../../components/primitives/Form";
import { useForm } from "../../utils/useForm";
import { emailErrors } from "../../utils/validate";
import { TextInput } from "../../components/primitives/Inputs";
// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { authFlags } from "../../mock-data/auth";
import TextLink from "../../components/primitives/TextLink";

/**
 * Inventory view `auth-confirm-account`.
 * /users/confirm: resend instructions (user_confirmation_html/new).
 * /users/confirm/:token: one-button confirm (edit).
 * Lightning redirects to /projects with a flash after either submit.
 */
export default function AuthConfirmAccountPage() {
  const { token } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const flags = authFlags(search);
  const footer = (
    <AuthFooterLinks
      left={<TextLink variant="plain" to="/users/log_in">Log in</TextLink>}
      right={flags.allowSignup && <TextLink variant="plain" to="/users/register">Register</TextLink>}
    />
  );
  // Confirming needs nothing typed; resending needs the email.
  const form = useForm({ initial: { email: "" }, validate: ({ email }) => ({ email: token ? [] : emailErrors(email) }) });

  return (
    <AuthLayout title={token ? "Confirm account" : "Resend confirmation instructions"}>
      <div id="reset-password">
        <Form {...form.formProps(() => navigate("/projects"))}>
          <AuthCard>
            {token ? (
              <Button type="submit">Confirm my account</Button>
            ) : (
              <>
                <TextInput id="user_email" type="email" label="Email" required {...form.fieldProps("email")} />
                <Button type="submit">Resend confirmation instructions</Button>
              </>
            )}
            {footer}
          </AuthCard>
        </Form>
      </div>
    </AuthLayout>
  );
}

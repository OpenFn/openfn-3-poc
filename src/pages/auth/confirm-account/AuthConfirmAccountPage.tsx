import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "@/components/auth/AuthCard";
import Button from "@/components/primitives/Button";
import Form from "@/components/primitives/Form";
import { TextInput } from "@/components/primitives/Inputs";
import TextLink from "@/components/primitives/TextLink";
import type { ResourceStatus } from "@/types/resource";
import { errorMessage } from "@/utils/errors";
import { useForm } from "@/utils/useForm";
import { emailErrors } from "@/utils/validate";

/** The contract between this page and whatever feeds it. */
export interface AuthConfirmAccountPageProps {
  /** Asking for the email again (/users/confirm), or confirming with the emailed link (/users/confirm/:token). */
  step: "resend" | "confirm";
  /** Resends the confirmation email. Resolves when the host has sent the person on; rejects with the refusal to show in the card. */
  onResend: (values: { email: string }) => Promise<void>;
  /** Confirms the account. Resolves when the host has sent the person on; rejects with the refusal to show in the card. */
  onConfirm: () => Promise<void>;
  /** Whether the instance lets people register, which shows the Register link. */
  allowSignup: boolean;
  /** Loading the sign-in options (and on the link, the session). The form works meanwhile; a failure shows in the card. */
  status?: ResourceStatus;
}

/**
 * Inventory view `auth-confirm-account` (user_confirmation_html/new and
 * edit). A refusal shows at the top of the card, where Lightning's flash is.
 */
export default function AuthConfirmAccountPage({ step, onResend, onConfirm, allowSignup, status }: AuthConfirmAccountPageProps) {
  const form = useForm({ initial: { email: "" }, validate: ({ email }) => ({ email: step === "resend" ? emailErrors(email) : [] }) });
  const { error, ...formProps } = form.formProps(step === "resend" ? onResend : onConfirm);
  const cardError = error ? errorMessage(error) : status?.state === "error" ? status.message : undefined;

  if (step === "confirm") {
    return (
      <AuthLayout title="Confirm account">
        <Form {...formProps}>
          <AuthCard error={cardError}>
            <Button type="submit">Confirm my account</Button>
          </AuthCard>
        </Form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Resend confirmation instructions">
      <Form {...formProps}>
        <AuthCard error={cardError}>
          <TextInput id="user_email" name="email" type="email" label="Email" required autoComplete="email" {...form.fieldProps("email")} />
          <Button type="submit">Resend confirmation instructions</Button>
          <AuthFooterLinks
            left={<TextLink variant="plain" to="/users/log_in">Log in</TextLink>}
            right={allowSignup && <TextLink variant="plain" to="/users/register">Register</TextLink>}
          />
        </AuthCard>
      </Form>
    </AuthLayout>
  );
}

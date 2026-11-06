import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "@/components/auth/AuthCard";
import { useCarriedFlash } from "@/components/auth/useCarriedFlash";
import Button from "@/components/primitives/Button";
import Form from "@/components/primitives/Form";
import { PasswordInput, TextInput } from "@/components/primitives/Inputs";
import TextLink from "@/components/primitives/TextLink";
import type { Flash, ResetPasswordValues } from "@/types/auth";
import type { ResourceStatus } from "@/types/resource";
import { errorMessage } from "@/utils/errors";
import { useForm } from "@/utils/useForm";
import { blank, emailErrors } from "@/utils/validate";

/** The contract between this page and whatever feeds it. */
export interface AuthResetPasswordPageProps {
  /** Asking for a link (/users/reset_password), or setting a new password with one (/users/reset_password/:token). */
  step: "request" | "reset";
  /** Asks for a reset link. Resolves when the host has sent the person on; rejects with the refusal to show in the card. */
  onRequest: (values: { email: string }) => Promise<void>;
  /** Sets the new password. Resolves when the host has sent the person on; rejects with field errors or a refusal. */
  onReset: (values: ResetPasswordValues) => Promise<void>;
  /** Whether the instance lets people register, which shows the Register link. */
  allowSignup: boolean;
  /** A message a redirect carried here ("Reset password link is invalid or it has expired."), or null. Shows at the top of the card until a refusal replaces it. */
  flash: Flash | null;
  /** Loading the instance's sign-in options. The form works meanwhile; a failure shows in the card, since Register may be missing. */
  status?: ResourceStatus;
}

/**
 * Inventory view `auth-reset-password` (user_reset_password_html/new and
 * edit). A refusal shows at the top of the card, where Lightning's flash is.
 */
export default function AuthResetPasswordPage({ step, onRequest, onReset, allowSignup, flash, status }: AuthResetPasswordPageProps) {
  const request = useForm({ initial: { email: "" }, validate: ({ email }) => ({ email: emailErrors(email) }) });
  const reset = useForm<ResetPasswordValues>({
    initial: { password: "", passwordConfirmation: "" },
    validate: ({ password, passwordConfirmation }) => ({
      password: blank(password),
      passwordConfirmation: passwordConfirmation === password ? [] : ["Your passwords do not match."],
    }),
  });
  const { error, ...formProps } = step === "request" ? request.formProps(onRequest) : reset.formProps(onReset);
  const cardError = error ? errorMessage(error) : status?.state === "error" ? status.message : undefined;
  const card = useCarriedFlash(flash, !!error, cardError);
  const logIn = <TextLink variant="plain" to="/users/log_in">Log in</TextLink>;
  const register = allowSignup && <TextLink variant="plain" to="/users/register">Register</TextLink>;

  if (step === "request") {
    return (
      <AuthLayout title="Forgot your password?">
        <div id="reset-password-new">
          <Form {...formProps}>
            <AuthCard {...card}>
              <TextInput id="user_email" name="email" type="email" label="Email" required autoComplete="email" {...request.fieldProps("email")} />
              <Button type="submit">Send instructions to reset password</Button>
              <AuthFooterLinks left={logIn} right={register} />
            </AuthCard>
          </Form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password">
      <div id="reset-password-edit">
        <Form {...formProps}>
          <AuthCard {...card}>
            <PasswordInput id="user_password" name="password" label="New password" required autoComplete="new-password" {...reset.fieldProps("password")} />
            <PasswordInput
              id="user_password_confirmation"
              name="password_confirmation"
              label="Confirm new password"
              required
              autoComplete="new-password"
              {...reset.fieldProps("passwordConfirmation")}
            />
            <Button type="submit">Reset password</Button>
            <AuthFooterLinks divider left={logIn} right={register} />
          </AuthCard>
        </Form>
      </div>
    </AuthLayout>
  );
}

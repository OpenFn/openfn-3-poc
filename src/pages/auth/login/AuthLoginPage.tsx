import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard, { AuthFooterLinks } from "@/components/auth/AuthCard";
import SsoLogin from "@/components/auth/SsoLogin";
import Button from "@/components/primitives/Button";
import Form from "@/components/primitives/Form";
import { PasswordInput, TextInput } from "@/components/primitives/Inputs";
import TextLink from "@/components/primitives/TextLink";
import type { Flash, SsoProvider } from "@/types/auth";
import type { ResourceStatus } from "@/types/resource";
import { errorMessage } from "@/utils/errors";
import { useForm } from "@/utils/useForm";
import { blank, emailErrors } from "@/utils/validate";

/** What the login form sends. */
export interface LogInValues {
  email: string;
  password: string;
}

/** The contract between this page and whatever feeds it. */
export interface AuthLoginPageProps {
  /** Signs in. Resolves when the host has sent the person on; rejects with the refusal to show above the form. */
  onLogIn: (values: LogInValues) => Promise<void>;
  /** Whether the instance lets people register, which shows the Register link. */
  allowSignup: boolean;
  /** The instance's external sign-in provider, or null for none. */
  ssoProvider: SsoProvider | null;
  /** A message a redirect carried here ("Logged out successfully."), or null. Shows at the top of the card until a refused sign-in replaces it. */
  flash: Flash | null;
  /** Loading the instance's sign-in options. The form works meanwhile; a failure shows in the card, since Register or the provider may be missing. */
  status?: ResourceStatus;
}

/**
 * Inventory view `auth-login` (user_session_html/new.html.heex). A refused
 * sign-in shows the host's message in the card. Lightning's Remember me
 * checkbox is gone: the API has no such field (docs/lightning-differences.md).
 */
export default function AuthLoginPage({ onLogIn, allowSignup, ssoProvider, flash, status }: AuthLoginPageProps) {
  const form = useForm<LogInValues>({
    initial: { email: "", password: "" },
    validate: ({ email, password }) => ({ email: emailErrors(email), password: blank(password) }),
  });
  // The refusal shows at the top of the card, where Lightning's flash is, not under the button.
  const { error, ...formProps } = form.formProps(onLogIn);
  const cardError = error ? errorMessage(error) : status?.state === "error" ? status.message : undefined;
  // Once refused, the carried message stays gone, as Lightning re-renders with only the new flash.
  const [replaced, setReplaced] = useState(false);
  if (error && !replaced) setReplaced(true);
  const carried = replaced ? null : flash;

  return (
    <AuthLayout title="Log in">
      <div id="login">
        <Form {...formProps}>
          <AuthCard
            error={cardError ?? (carried?.tone === "danger" ? carried.message : undefined)}
            info={carried?.tone === "info" ? carried.message : undefined}
          >
            <TextInput id="user_email" name="email" type="email" label="Email" required autoComplete="email" {...form.fieldProps("email")} />
            <PasswordInput id="user_password" name="password" label="Password" required autoComplete="current-password" {...form.fieldProps("password")} />
            <Button type="submit">Log in</Button>
            {ssoProvider && <SsoLogin provider={ssoProvider} />}
            <AuthFooterLinks
              divider
              left={allowSignup && <TextLink variant="plain" to="/users/register">Register</TextLink>}
              right={<TextLink variant="plain" to="/users/reset_password">Forgot your password?</TextLink>}
            />
          </AuthCard>
        </Form>
      </div>
    </AuthLayout>
  );
}

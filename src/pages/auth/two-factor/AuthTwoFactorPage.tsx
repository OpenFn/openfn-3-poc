import AuthPanelLayout, { AuthPanel, HavingProblems } from "@/components/auth/AuthPanelLayout";
import Alert from "@/components/primitives/Alert";
import Button from "@/components/primitives/Button";
import Form from "@/components/primitives/Form";
import { TextInput } from "@/components/primitives/Inputs";
import TextLink from "@/components/primitives/TextLink";
import type { TwoFactorMethod } from "@/types/auth";
import { errorMessage } from "@/utils/errors";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";

/** The contract between this page and whatever feeds it. */
export interface AuthTwoFactorPageProps {
  /** Which code the page asks for. */
  method: TwoFactorMethod;
  /** Where the link to the other method goes. */
  otherMethodHref: string;
  /** Sends the code. Resolves when the host has sent the person on; rejects with the refusal to show. */
  onVerify: (code: string) => Promise<void>;
}

/**
 * Inventory view `auth-two-factor` (user_totp_html/new.html.heex): the
 * second step of signing in, with an authenticator code or a backup code.
 */
export default function AuthTwoFactorPage({ method, otherMethodHref, onVerify }: AuthTwoFactorPageProps) {
  const form = useForm({ initial: { code: "" }, validate: ({ code }) => ({ code: blank(code) }) });
  // The refusal shows at the top of the panel, where Lightning's flash is.
  const { error, ...formProps } = form.formProps(({ code }) => onVerify(code));

  return (
    <AuthPanelLayout title="Two-factor authentication">
      <AuthPanel>
        {error != null && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Form {...formProps}>
          <TextInput
            id="user_code"
            label={method === "backup_code" ? "Backup Code" : "Authentication Code"}
            hint={
              method === "totp"
                ? "Open your two-factor authenticator (TOTP) app or browser extension to view your authentication code."
                : "Use one of your backup codes. Kindly note that a backup code can only be used once"
            }
            name="code"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="XXXXXX"
            {...form.fieldProps("code")}
          />
          <Button type="submit" className="w-full">
            Verify
          </Button>
        </Form>
      </AuthPanel>
      <HavingProblems>
        <li>
          <TextLink to={otherMethodHref}>{method === "totp" ? "Use your backup code" : "Use your authenticator app"}</TextLink>
        </li>
      </HavingProblems>
    </AuthPanelLayout>
  );
}

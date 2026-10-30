// eslint-disable-next-line no-restricted-imports -- debt: not yet split into page and .replica.tsx wrapper (STANDARDS §11).
import { useLocation, useNavigate } from "react-router-dom";
import AuthPanelLayout, {
  AuthPanel,
  HavingProblems,
} from "../../components/auth/AuthPanelLayout";
import Alert from "../../components/primitives/Alert";
import Form from "../../components/primitives/Form";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";
import TextLink from "../../components/primitives/TextLink";
import Button from "../../components/primitives/Button";
import { TextInput } from "../../components/primitives/Inputs";
import { authMessages } from "../../constants";
import type { TwoFactorMethod } from "../../types/auth";

/**
 * Inventory view `auth-two-factor` (user_totp_html/new.html.heex).
 * ?authentication_type=backup_code switches to the backup-code form, as in
 * Lightning; ?error=1 shows the invalid-code message. Any code is accepted.
 */
export default function AuthTwoFactorPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const q = new URLSearchParams(search);
  const method: TwoFactorMethod = q.get("authentication_type") === "backup_code" ? "backup_code" : "totp";
  const other: TwoFactorMethod = method === "totp" ? "backup_code" : "totp";

  const form = useForm({ initial: { code: "" }, validate: ({ code }) => ({ code: blank(code) }) });

  return (
    <AuthPanelLayout title="Two-factor authentication">
      <AuthPanel>
        {q.has("error") && <Alert tone="danger">{authMessages.invalidTwoFactorCode}</Alert>}
        <Form {...form.formProps(() => navigate("/projects"))}>
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
          <TextLink to={`/users/two-factor?authentication_type=${other}`}>
            {method === "totp" ? "Use your backup code" : "Use your authenticator app"}
          </TextLink>
        </li>
      </HavingProblems>
    </AuthPanelLayout>
  );
}

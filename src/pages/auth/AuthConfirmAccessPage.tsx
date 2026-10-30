import { useState } from "react";
import AuthPanelLayout, {
  AuthPanel,
  HavingProblems,
} from "../../components/auth/AuthPanelLayout";
import Alert from "../../components/primitives/Alert";
import Form from "../../components/primitives/Form";
import { blank } from "../../utils/validate";
import TextLink from "../../components/primitives/TextLink";
import Button from "../../components/primitives/Button";
import UserAvatar from "../../components/primitives/UserAvatar";
import { PasswordInput, TextInput } from "../../components/primitives/Inputs";
import { errorMessage } from "../../utils/errors";
import { useForm } from "../../utils/useForm";

/** What the user confirms with: one or the other. */
export type ConfirmAccessValues = { password: string } | { code: string };

/** The contract between this page and whatever feeds it (the replica wrapper, later Lightning). */
export interface AuthConfirmAccessPageProps {
  user: { firstName: string; lastName: string; mfaEnabled: boolean };
  /** Confirms. Resolves when the host accepts (it then sends the user on); rejects with the refusal to show. */
  onConfirm: (values: ConfirmAccessValues) => Promise<void>;
}

/**
 * Inventory view `auth-confirm-access` (re_authenticate_live/new.html.heex):
 * the sudo-mode re-authentication page. Password by default; the
 * authenticator option appears when the user has MFA on, and switching is
 * the page's own. Props only, so it can run unchanged in Lightning.
 */
export default function AuthConfirmAccessPage({ user, onConfirm }: AuthConfirmAccessPageProps) {
  const [option, setOption] = useState<"password" | "totp">("password");
  // One box, for the password or the code: our own can't-be-blank, as on every form.
  const form = useForm({ initial: { value: "" }, validate: ({ value }) => ({ value: blank(value) }) });
  const { error, ...formProps } = form.formProps(({ value }) => onConfirm(option === "password" ? { password: value } : { code: value }));

  const switchTo = (next: "password" | "totp") => {
    setOption(next);
    form.reset();
  };

  return (
    <AuthPanelLayout title="Confirm access">
      <AuthPanel size="sm">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar firstName={user.firstName} lastName={user.lastName} size="sm" />
          <p>
            Signed in as: <span className="font-bold">{`${user.firstName} ${user.lastName}`}</span>
          </p>
        </div>
      </AuthPanel>
      <AuthPanel>
        {/* The failure sits at the top of the panel, as Lightning's flash does; the button is inside the form, not after it. */}
        {error && <Alert tone="danger">{errorMessage(error)}</Alert>}
        <Form id="reauthentication-form" {...formProps}>
          {option === "password" ? (
            <PasswordInput
              id="user_password"
              name="password"
              label="Password"
              hint="Enter your password to confirm access"
              required
              autoComplete="current-password"
              {...form.fieldProps("value")}
            />
          ) : (
            <TextInput
              id="user_code"
              name="code"
              label="Authentication Code"
              hint="Open your two-factor authenticator (TOTP) app or browser extension to view your authentication code."
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="XXXXXX"
              {...form.fieldProps("value")}
            />
          )}
          <Button type="submit" className="w-full">
            {option === "password" ? "Confirm" : "Verify"}
          </Button>
        </Form>
      </AuthPanel>
      <HavingProblems>
        {option === "password" && user.mfaEnabled && (
          <li>
            <TextLink id="use-totp" onClick={() => switchTo("totp")}>
              Use your authenticator app instead
            </TextLink>
          </li>
        )}
        {option === "totp" && (
          <li>
            <TextLink id="use-password" onClick={() => switchTo("password")}>
              Use your password instead
            </TextLink>
          </li>
        )}
      </HavingProblems>
    </AuthPanelLayout>
  );
}

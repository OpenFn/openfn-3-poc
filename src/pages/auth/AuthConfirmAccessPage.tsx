import { useState } from "react";
import AuthPanelLayout, {
  AuthPanel,
  HavingProblems,
} from "@/components/auth/AuthPanelLayout";
import Alert from "@/components/primitives/Alert";
import Form from "@/components/primitives/Form";
import { blank } from "@/utils/validate";
import Button from "@/components/primitives/Button";
import UserAvatar from "@/components/primitives/UserAvatar";
import ConfirmAccessField, { ConfirmAccessSwitch, type ConfirmAccessMethod } from "@/components/domain/ConfirmAccessField";
import { errorMessage } from "@/utils/errors";
import { useForm } from "@/utils/useForm";

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
  const [option, setOption] = useState<ConfirmAccessMethod>("password");
  // One box, for the password or the code: our own can't-be-blank, as on every form.
  const form = useForm({ initial: { value: "" }, validate: ({ value }) => ({ value: blank(value) }) });
  const { error, ...formProps } = form.formProps(({ value }) => onConfirm(option === "password" ? { password: value } : { code: value }));

  const switchTo = (next: ConfirmAccessMethod) => {
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
          <ConfirmAccessField method={option} {...form.fieldProps("value")} />
          <Button type="submit" className="w-full">
            {option === "password" ? "Confirm" : "Verify"}
          </Button>
        </Form>
      </AuthPanel>
      <HavingProblems>
        {(option === "totp" || user.mfaEnabled) && (
          <li>
            <ConfirmAccessSwitch method={option} onSwitch={switchTo} />
          </li>
        )}
      </HavingProblems>
    </AuthPanelLayout>
  );
}

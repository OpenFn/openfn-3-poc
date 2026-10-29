import { useState } from "react";
import Alert from "../Alert";
import Button from "../Button";
import ConfirmModal from "../ConfirmModal";
import Heading from "../Heading";
import { TextInput } from "../Inputs";
import Modal from "../Modal";
import SectionHeader from "../SectionHeader";
import TextLink from "../TextLink";
import Toggle from "../Toggle";
import Card from "../Card";
import type { MfaSettings, MfaSetupResult } from "../../types/profile";
import { errorMessage } from "../../utils/errors";
import { useAction } from "../../utils/useAction";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";

interface Props {
  mfa: MfaSettings;
  /** Starts setting up an authenticator app. The secret and QR code arrive only in this reply. */
  onStartSetup: () => Promise<MfaSetupResult>;
  /** Saves the setup with the code the app shows. Rejects with field errors (`code`) or a message. */
  onConfirm: (code: string) => Promise<void>;
  onDisable: () => Promise<void>;
}

/**
 * The MFA card on /profile (profile_live/mfa_component.html.heex). The switch
 * doesn't save on its own: off → on asks the host for a secret and shows the
 * setup form; on → off asks to confirm "Disable MFA". With MFA on it links to
 * the recovery codes. The secret lives here only while the setup form is open.
 */
export default function MfaCard({ mfa, onStartSetup, onConfirm, onDisable }: Props) {
  const id = "mfa_section";
  const [setup, setSetup] = useState<MfaSetupResult | null>(null);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  // After a confirmed setup the switch stays on until the host's props say MFA is on.
  const [confirmed, setConfirmed] = useState(false);
  const [lastEnabled, setLastEnabled] = useState(mfa.enabled);
  if (lastEnabled !== mfa.enabled) {
    setLastEnabled(mfa.enabled);
    setConfirmed(false);
  }
  const form = useForm({
    initial: { code: "" },
    // Lightning's UserTOTP changeset wording.
    validate: ({ code }) => ({ code: code.trim() && !/^\d{6}$/.test(code) ? ["should be a 6 digit number"] : blank(code) }),
    clearOnSave: true,
  });
  const start = useAction(
    async () => {
      const result = await onStartSetup();
      form.reset();
      setShowSecret(false);
      setSetup(result);
    },
    { onError: "toast" }
  );
  const enabled = mfa.enabled || confirmed;
  const show = enabled || setup !== null;

  const toggle = () => {
    if (enabled) setConfirmDisable(true);
    else if (setup) setSetup(null);
    else void start.run();
  };

  return (
    <Card
      padding="lg"
      annotation="profile-mfa"
      title={<span id={`${id}-label`}>Enable multi-factor authentication</span>}
      description={
        <span id={`${id}-description`}>
          This adds an additional layer of security to your account by requiring more than just a password to sign in.
        </span>
      }
      // The switch shows the choice at once while setup starts, and goes back if it fails.
      action={<Toggle id="toggle-mfa-switch" checked={show || start.pending} onChange={toggle} disabled={start.pending || form.pending} labelledBy={`${id}-label`} />}
    >
      {show && (
        <div className="space-y-5 border-t border-strong pt-5 text-sm">
          {enabled && !setup && (
            <p>
              You have configured an authentication app to get two-factor authentication codes.{" "}
              <TextLink id="setup_another_totp_device" onClick={() => void start.run()}>
                Setup another device instead
              </TextLink>
            </p>
          )}

          {setup && (
            <div className="space-y-2 text-muted">
              <Heading>Authenticator app</Heading>
              <p>
                Authenticator apps and browser extensions like 1Password, Authy etc. generate one-time passwords that
                are used as a second factor to verify your identity when prompted during sign-in.
              </p>
              <Heading>Scan the QR code</Heading>
              <p>Use an authenticator app or browser extension to scan.</p>
              <img src={setup.qrCodeSrc} alt="QR code for your authenticator app" className="h-44 w-44" />
              <p>
                Unable to scan? You can use <TextLink onClick={() => setShowSecret(true)}>this secret key</TextLink> to
                manually configure your authenticator app.
              </p>
              <form
                id="set_totp_form"
                className="max-w-md space-y-4"
                onSubmit={form.submit(async ({ code }) => {
                  await onConfirm(code);
                  setConfirmed(true);
                  setSetup(null);
                })}
              >
                <TextInput
                  label="Verify the code from the app"
                  autoComplete="one-time-code"
                  placeholder="XXXXXX"
                  {...form.fieldProps("code")}
                />
                {form.error && <Alert type="danger">{errorMessage(form.error)}</Alert>}
                <div className="flex gap-1">
                  <Button variant="secondary" disabled={form.pending} onClick={() => setSetup(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" pending={form.pending}>
                    Save
                  </Button>
                </div>
              </form>
              <Modal open={showSecret} onClose={() => setShowSecret(false)} title="Your two-factor secret" size="sm">
                <code className="text-sm text-muted">{setup.secret}</code>
              </Modal>
            </div>
          )}

          {enabled && (
            <SectionHeader
              title="Recovery codes"
              subtitle="Recovery codes can be used to access your account in the event you lose access to your device and cannot receive two-factor authentication codes."
              action={
                <Button variant="secondary" to={mfa.backupCodesHref}>
                  View
                </Button>
              }
            />
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        title="Disable MFA"
        tone="danger"
        confirmLabel="Disable"
        confirmId="disable_mfa_button"
        onConfirm={async () => {
          await onDisable();
          setConfirmDisable(false);
          setConfirmed(false);
          setSetup(null);
        }}
      >
        <p>
          Are you sure you want to disable MFA from your account? This will make your account less secure. Should an
          attacker get hold of your password, there will be nothing preventing them from accessing your account
        </p>
      </ConfirmModal>
    </Card>
  );
}

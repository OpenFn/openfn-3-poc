import { useState } from "react";
import AuthPanelLayout, { AuthPanel } from "@/components/auth/AuthPanelLayout";
import Alert from "@/components/primitives/Alert";
import Button from "@/components/primitives/Button";
import { Row, Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import TextLink from "@/components/primitives/TextLink";
import { authMessages } from "@/constants";
import { errorMessage } from "@/utils/errors";
import { useAction } from "@/utils/useAction";

/** What the host answers a resend with. */
export type ResendResult = { status: "sent" } | { status: "throttled"; message: string } | { status: "failed" };

/** The contract between this page and whatever feeds it. */
export interface AuthConfirmationRequiredPageProps {
  /** Asks for a new link to the account's address. Resolves with what happened; the page shows it. */
  onResend: () => Promise<ResendResult>;
}

/**
 * Inventory view `auth-confirmation-required`
 * (user_confirmation_required_live.html.heex): the one page a locked-out
 * account can reach. It never shows the address (docs/lightning-differences.md).
 */
export default function AuthConfirmationRequiredPage({ onResend }: AuthConfirmationRequiredPageProps) {
  const [resent, setResent] = useState<ResendResult | null>(null);
  // Each answer replaces the last.
  const resend = useAction(async () => {
    setResent(null);
    setResent(await onResend());
  });

  return (
    <AuthPanelLayout title="Confirm your email address" align="top">
      <AuthPanel>
        <Text as="div" tone="muted">
          <Stack gap="md">
            <p>
              Your account is blocked pending email confirmation. We sent a confirmation link to your email address when
              you signed up — open it to keep using OpenFn.
            </p>
            <p>If that link has expired, request a new one.</p>
            {resent?.status === "sent" && (
              <Alert tone="info" id="confirmation-email-sent">
                We have sent a new confirmation link to your email address.
              </Alert>
            )}
            {resent?.status === "throttled" && (
              <Alert tone="warning" id="confirmation-email-throttled">
                {resent.message}
              </Alert>
            )}
            {resent?.status === "failed" && (
              <Alert tone="danger" id="confirmation-email-failed">
                {authMessages.resendFailed}
              </Alert>
            )}
            {resend.error && <Alert tone="danger">{errorMessage(resend.error)}</Alert>}
            <Row>
              <Button id="resend-confirmation-email-button" onClick={() => void resend.run()} pending={resend.pending}>
                Resend confirmation email
              </Button>
            </Row>
          </Stack>
        </Text>
      </AuthPanel>

      <Text>
        <TextLink to="/users/log_out">Log out</TextLink>
      </Text>
    </AuthPanelLayout>
  );
}

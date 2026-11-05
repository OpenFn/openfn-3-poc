import { isApiError } from "@/api/client";
import { useMfa, useMfaSaves } from "@/api/mfa";
import BackupCodesPage from "./BackupCodesPage";

/**
 * BackupCodesPage's .query file: loads the MFA settings from the API. It only
 * passes data and actions; the toasts and the password popup are the page's.
 * The demo has no printable copy, so Print prints the page.
 */
export default function BackupCodesPageQuery() {
  const { status, enabled, codes } = useMfa();
  const { regenerate, stepUp } = useMfaSaves();

  return (
    <BackupCodesPage
      status={status}
      codes={codes}
      mfaEnabled={enabled}
      onRegenerate={regenerate}
      isStepUpRequired={(error) => isApiError(error, "step_up_required")}
      onStepUp={stepUp}
      onPrint={() => window.print()}
      profileHref="/profile"
    />
  );
}

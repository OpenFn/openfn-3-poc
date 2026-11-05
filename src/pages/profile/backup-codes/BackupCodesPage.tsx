import { useRef, useState } from "react";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Button from "@/components/primitives/Button";
import EmptyState from "@/components/primitives/EmptyState";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { useToast } from "@/components/primitives/Toast";
import StepUpDialog, { type StepUpCredentials } from "@/components/domain/StepUpDialog";
import { useStepUp } from "@/components/domain/useStepUp";
import BackupCodesCard from "@/components/profile/BackupCodesCard";
import MfaDisabledNotice from "@/components/profile/MfaDisabledNotice";
import type { BackupCode } from "@/types/tokens";
import type { ResourceStatus } from "@/types/resource";
import { useAction } from "@/utils/useAction";

/** What its .query file passes in: data and the actions that change it. */
export interface BackupCodesPageProps {
  /** Where loading the codes stands, when the host loads them after the page renders. Left out, they are ready. */
  status?: ResourceStatus;
  /** The signed-in user's recovery codes, used ones included, as the server lists them; null until the person confirms it's them. */
  codes: BackupCode[] | null;
  /** Whether the user has MFA on; without it the page shows the "MFA Disabled" notice above the codes. The popup offers the authenticator code only with it. */
  mfaEnabled: boolean;
  /** Replaces every code. Rejects on failure, which the page toasts. */
  onRegenerate: () => Promise<void>;
  /** Whether a refusal means "confirm it's you first" (the API's step_up_required). Regenerate then asks for the password and tries again. */
  isStepUpRequired: (error: unknown) => boolean;
  /** Confirms it's you with a password or authenticator code, after which `codes` arrive. Rejects with the server's words when it's wrong. */
  onStepUp: (credentials: StepUpCredentials) => Promise<void>;
  /** Opens the printable copy. */
  onPrint: () => void;
  /** The profile page, where MFA is turned on. */
  profileHref: string;
}

/**
 * Inventory view `profile-backup-codes` (backup_codes_live/index.html.heex).
 * Lightning sends you to Confirm access before the page opens; here the
 * page asks in a popup while `codes` is null, and again if Regenerate is
 * refused.
 */
export default function BackupCodesPage({
  status = { state: "ready" },
  codes,
  mfaEnabled,
  onRegenerate,
  isStepUpRequired,
  onStepUp,
  onPrint,
  profileHref,
}: BackupCodesPageProps) {
  const toast = useToast();
  const [asking, setAsking] = useState(true);
  const confirmButton = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const confirm = async (credentials: StepUpCredentials) => {
    await onStepUp(credentials);
    setAsking(false);
  };
  const [guardedRegenerate, stepUpDialog] = useStepUp(onRegenerate, { isStepUpRequired, stepUp: onStepUp, hasMfa: mfaEnabled });
  const regenerate = useAction(guardedRegenerate, {
    onError: "toast",
    onSuccess: () => toast("New Backup Codes Generated!"),
  });

  return (
    <PageContent header={<Header title="Two-factor backup codes" />}>
      {stepUpDialog}
      <Centered>
        <div className="space-y-4 md:w-2/3">
          <p>
            Recovery codes can be used to access your account in the event you lose access to your device and cannot
            receive two-factor authentication codes.
          </p>
          <AsyncBoundary status={status}>
            {!mfaEnabled && <MfaDisabledNotice profileHref={profileHref} />}
            {codes ? (
              <BackupCodesCard
                codes={codes}
                onRegenerate={() => regenerate.run()}
                pending={regenerate.pending}
                onPrint={onPrint}
              />
            ) : (
              <>
                {/* Not useStepUp: that wraps an action, and here nothing was pressed; the load came back without the codes. */}
                {asking && (
                  <StepUpDialog
                    open
                    hasMfa={mfaEnabled}
                    onSubmit={confirm}
                    onClose={() => {
                      setAsking(false);
                      // The popup opened by itself, so there is no button to hand focus back to but this one.
                      confirmButton.current?.focus();
                    }}
                  />
                )}
                <EmptyState variant="plain" icon="hero-lock-closed" message="Confirm it's you to see your backup codes.">
                  <Button ref={confirmButton} onClick={() => setAsking(true)}>
                    Confirm access
                  </Button>
                </EmptyState>
              </>
            )}
          </AsyncBoundary>
        </div>
      </Centered>
    </PageContent>
  );
}

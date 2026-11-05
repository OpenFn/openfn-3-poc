import { useState, type ReactNode } from "react";
import StepUpDialog, { type StepUpCredentials } from "./StepUpDialog";

export interface StepUpOptions {
  /** Whether a refusal means "step up first" (the API's 403 `step_up_required`). */
  isStepUpRequired: (error: unknown) => boolean;
  /** Steps the session up. Rejects with the server's words when the password or code is wrong. */
  stepUp: (credentials: StepUpCredentials) => Promise<void>;
  /** Whether the person has an authenticator, so the dialog offers the code. */
  hasMfa: boolean;
}

/**
 * Wraps an action the server may refuse until the person confirms it's them.
 * The returned function runs `action`; if that is refused with step-up
 * required, it opens the Confirm access dialog, and once the person has
 * stepped up it runs `action` once more and settles with that result.
 * Cancel rejects with the original refusal, so `useAction` reports the
 * action as not done. Render the returned element anywhere on the page.
 */
export function useStepUp<Args extends unknown[], R>(
  action: (...args: Args) => Promise<R>,
  { isStepUpRequired, stepUp, hasMfa }: StepUpOptions
): [guarded: (...args: Args) => Promise<R>, dialog: ReactNode] {
  // The waiting run's way on: carry on after stepping up, or give up.
  const [waiting, setWaiting] = useState<{ retry: () => void; cancel: () => void } | null>(null);

  const guarded = async (...args: Args) => {
    try {
      return await action(...args);
    } catch (refusal) {
      if (!isStepUpRequired(refusal)) throw refusal;
      await new Promise<void>((resolve, reject) => setWaiting({ retry: resolve, cancel: () => reject(refusal) }));
      return action(...args);
    }
  };

  const dialog = waiting && (
    <StepUpDialog
      open
      hasMfa={hasMfa}
      onSubmit={async (credentials) => {
        await stepUp(credentials);
        setWaiting(null);
        waiting.retry();
      }}
      onClose={() => {
        setWaiting(null);
        waiting.cancel();
      }}
    />
  );

  return [guarded, dialog];
}

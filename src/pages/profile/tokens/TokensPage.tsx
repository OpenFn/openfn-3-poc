import Button from "@/components/primitives/Button";
import Section from "@/components/primitives/Section";
import NewTokenBanner from "@/components/profile/NewTokenBanner";
import TokensTable from "@/components/profile/TokensTable";
import TokenDeletionModal from "@/components/profile/TokenDeletionModal";
import { useState } from "react";
import { useToast } from "@/components/primitives/Toast";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import type { ApiToken } from "@/types/tokens";
import type { ResourceStatus } from "@/types/resource";
import { useAction } from "@/utils/useAction";
import { useStepUp } from "@/components/domain/useStepUp";
import type { StepUpCredentials } from "@/components/domain/StepUpDialog";

/** What its .query file passes in: data, the actions that change it, and where you are. */
export interface TokensPageProps {
  /** Where loading the tokens stands, when the host loads them after the page renders. Left out, they are ready. */
  status?: ResourceStatus;
  /** The signed-in user's tokens, newest first, as the server lists them. */
  tokens: ApiToken[];
  /** The token whose delete modal is open (/profile/tokens/:tokenId/delete); otherwise null. */
  tokenId: string | null;
  /** Generates a token. Resolves with its full secret, which is never sent again; rejects on failure, which the page toasts. */
  onGenerate: () => Promise<string>;
  /** Deletes a token. Rejects on failure, which the modal shows inline. */
  onDelete: (id: string) => Promise<void>;
  /** Closes the delete modal, after a delete or on Cancel. */
  onClose: () => void;
  /** Whether a refusal means "confirm it's you first" (the API's step_up_required). Generate then asks for the password and tries again. */
  isStepUpRequired: (error: unknown) => boolean;
  /** Confirms it's you with a password or authenticator code. Rejects with the server's words when it's wrong. */
  onStepUp: (credentials: StepUpCredentials) => Promise<void>;
  /** Whether the person has an authenticator, so the popup offers the code. */
  hasMfa: boolean;
}

/**
 * Inventory view `profile-tokens` (tokens_live/index.html.heex): "Generate
 * new token" shows the new token once in a banner; the table masks the rest.
 * The page owns how it behaves (the banner, the toasts); its .query file,
 * TokensPage.query.tsx, only passes data and actions.
 */
export default function TokensPage({ status = { state: "ready" }, tokens, tokenId, onGenerate, onDelete, onClose, isStepUpRequired, onStepUp, hasMfa }: TokensPageProps) {
  const toast = useToast();
  const [newToken, setNewToken] = useState<string | null>(null);
  const [guardedGenerate, stepUpDialog] = useStepUp(onGenerate, { isStepUpRequired, stepUp: onStepUp, hasMfa });
  const generate = useAction(guardedGenerate, {
    onError: "toast",
    onSuccess: (secret) => {
      setNewToken(secret);
      toast("Token created successfully");
    },
  });
  const remove = async (id: string) => {
    await onDelete(id);
    toast("Token deleted successfully");
  };

  return (
    <Section
      size="lg"
      title="API tokens"
      description="Personal access tokens let the OpenFn CLI and API act as you."
      action={
        <Button onClick={() => generate.run()} pending={generate.pending} icon="hero-plus">
          Generate new token
        </Button>
      }
    >
      {stepUpDialog}
      {tokenId && tokens.some((t) => t.id === tokenId) && (
        <TokenDeletionModal onClose={onClose} onDelete={() => remove(tokenId)} />
      )}
      {newToken && <NewTokenBanner token={newToken} />}
      <AsyncBoundary status={status}>
        <TokensTable tokens={tokens} />
      </AsyncBoundary>
    </Section>
  );
}

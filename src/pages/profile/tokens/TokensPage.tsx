import Header from "../../../components/primitives/Header";
import Button from "../../../components/primitives/Button";
import { Centered, PageContent } from "../../../components/primitives/PageContent";
import NewTokenBanner from "../../../components/profile/NewTokenBanner";
import TokensTable from "../../../components/profile/TokensTable";
import { Stack } from "../../../components/primitives/Stack";
import TokenDeletionModal from "../../../components/profile/TokenDeletionModal";
import { useState } from "react";
import { useToast } from "../../../components/primitives/Toast";
import type { ApiToken } from "../../../types/tokens";
import { useAction } from "../../../utils/useAction";

/** What the route passes in: data, the actions that change it, and where you are. */
export interface TokensPageProps {
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
}

/**
 * Inventory view `profile-tokens` (tokens_live/index.html.heex): "Generate
 * New Token" shows the new token once in a banner; the table masks the rest.
 * The page owns how it behaves (the banner, the toasts); its route,
 * TokensPage.route.tsx, only passes data and actions.
 */
export default function TokensPage({ tokens, tokenId, onGenerate, onDelete, onClose }: TokensPageProps) {
  const toast = useToast();
  const [newToken, setNewToken] = useState<string | null>(null);
  const generate = useAction(onGenerate, {
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
    <PageContent
      header={
        <Header title="Personal Access Tokens">
          <Button onClick={() => generate.run()} pending={generate.pending} icon="hero-plus">
            Generate New Token
          </Button>
        </Header>
      }
    >
      <Centered>
        {tokenId && tokens.some((t) => t.id === tokenId) && (
          <TokenDeletionModal onClose={onClose} onDelete={() => remove(tokenId)} />
        )}
        <Stack>
          {newToken && <NewTokenBanner token={newToken} />}
          <TokensTable tokens={tokens} />
        </Stack>
      </Centered>
    </PageContent>
  );
}

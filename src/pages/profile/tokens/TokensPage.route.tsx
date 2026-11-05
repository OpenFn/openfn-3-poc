import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiTokens, generateFakeToken } from "@/mock-data/tokens";
import { simulateRequest } from "@/mock-data/request";
import TokensPage from "./TokensPage";

/**
 * TokensPage's route: holds the fixtures in state as the server would, and
 * reads the delete modal's token from the URL. It only passes data and
 * actions; the banner and toasts are the page's.
 */
export default function TokensPageReplica() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(apiTokens);

  return (
    <TokensPage
      tokens={tokens}
      tokenId={tokenId ?? null}
      onGenerate={async () => {
        const { token, secret } = await simulateRequest(generateFakeToken());
        setTokens((list) => [token, ...list]);
        return secret;
      }}
      onDelete={async (id) => {
        await simulateRequest();
        setTokens((list) => list.filter((t) => t.id !== id));
      }}
      onClose={() => navigate("/profile/tokens")}
    />
  );
}

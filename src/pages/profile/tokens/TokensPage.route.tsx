import { useNavigate, useParams } from "react-router-dom";
import { useTokens, useTokenSaves } from "../../../api/tokens";
import TokensPage from "./TokensPage";

/**
 * TokensPage's route: loads the tokens from the API and reads the delete
 * modal's token from the URL. It only passes data and actions; the banner and
 * toasts are the page's. Generating without a stepped-up session rejects with
 * an `ApiError` whose code is `step_up_required` (`isApiError` in
 * src/api/client.ts); until the password pop-up is wired, the page toasts it.
 */
export default function TokensPageRoute() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { status, tokens } = useTokens();
  const { generate, remove } = useTokenSaves();

  return (
    <TokensPage
      status={status}
      tokens={tokens}
      tokenId={tokenId ?? null}
      onGenerate={generate}
      onDelete={remove}
      onClose={() => navigate("/profile/tokens")}
    />
  );
}

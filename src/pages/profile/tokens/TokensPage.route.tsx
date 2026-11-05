import { useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { stepUp } from "@/api/session";
import { useTokens, useTokenSaves } from "@/api/tokens";
import { useCurrentUser } from "@/session/session";
import TokensPage from "./TokensPage";

/**
 * TokensPage's route: loads the tokens from the API and reads the delete
 * modal's token from the URL. It only passes data and actions; the banner, the
 * toasts and the password popup are the page's.
 */
export default function TokensPageRoute() {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const { status, tokens } = useTokens();
  const { generate, remove } = useTokenSaves();
  const user = useCurrentUser();

  return (
    <TokensPage
      status={status}
      tokens={tokens}
      tokenId={tokenId ?? null}
      onGenerate={generate}
      onDelete={remove}
      onClose={() => navigate("/profile/tokens")}
      isStepUpRequired={(error) => isApiError(error, "step_up_required")}
      onStepUp={async (credentials) => void (await stepUp(credentials))}
      hasMfa={user.mfaEnabled}
    />
  );
}

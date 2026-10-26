import { useNavigate } from "react-router-dom";
import FirstSetupShell from "../../components/auth/FirstSetupShell";
import { simulateRequest } from "../../mock-data/request";
import { useInstanceInfo } from "../../session/session";
import FirstSetupPage from "./FirstSetupPage";

/**
 * The replica's side of FirstSetupPage: the empty first-setup shell around
 * it, and a save that goes to /projects. Lightning's live layout draws the
 * shell and replaces this file with a LiveView wrapper.
 */
export default function FirstSetupPageReplica() {
  const navigate = useNavigate();
  const { releaseLabel } = useInstanceInfo();
  return (
    <FirstSetupShell releaseLabel={releaseLabel}>
      <FirstSetupPage
        onSave={async () => {
          await simulateRequest();
          navigate("/projects");
        }}
      />
    </FirstSetupShell>
  );
}

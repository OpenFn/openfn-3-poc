import { useNavigate } from "react-router-dom";
import FirstSetupShell from "@/components/auth/FirstSetupShell";
import { simulateRequest } from "@/mock-data/request";
import { session } from "@/mock-data/users";
import FirstSetupPage from "./FirstSetupPage";

/**
 * The replica's side of FirstSetupPage: the empty first-setup shell around
 * it, and a save that goes to /projects. Lightning's live layout draws the
 * shell and replaces this file with a LiveView wrapper.
 */
export default function FirstSetupPageReplica() {
  const navigate = useNavigate();
  // Outside SessionGate there is no session to read it from. debt: GET /api/instance has it, once this page moves to a .query file.
  const { releaseLabel } = session.instance;
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

import { Navigate, useNavigate } from "react-router-dom";
import { useSignInOptions, useSessionSaves } from "@/api/session";
import FirstSetupShell from "@/components/auth/FirstSetupShell";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { authMessages } from "@/constants";
import FirstSetupPage from "./FirstSetupPage";

/**
 * FirstSetupPage's .query file. Open to anyone while the instance says it's a
 * fresh install; once it isn't, it goes to the projects list without a word,
 * as Lightning does. Saving signs the new superuser in, and the projects list
 * toasts the message.
 */
export default function FirstSetupPageQuery() {
  const navigate = useNavigate();
  const { status, needsSetup, releaseLabel } = useSignInOptions();
  const { createAccount } = useSessionSaves();

  if (status.state !== "ready") return <AsyncBoundary status={status} titleAs="h1" />;
  if (!needsSetup) return <Navigate to="/projects" replace />;
  return (
    <FirstSetupShell releaseLabel={releaseLabel}>
      <FirstSetupPage
        onSave={async (values) => {
          await createAccount(values);
          void navigate("/projects", { replace: true, state: { flash: { tone: "info", message: authMessages.superuserCreated } } });
        }}
      />
    </FirstSetupShell>
  );
}

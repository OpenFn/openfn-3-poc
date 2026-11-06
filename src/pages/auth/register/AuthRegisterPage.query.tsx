import { Navigate, useNavigate } from "react-router-dom";
import { useSession, useSessionSaves, useSignInOptions } from "@/api/session";
import PlainTextResponse from "@/components/auth/PlainTextResponse";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { authMessages, signupDisabledMessage } from "@/constants";
import AuthRegisterPage from "./AuthRegisterPage";

/**
 * AuthRegisterPage's .query file. Someone signed in goes to the projects
 * list; with sign-up off, Lightning's plain-text answer. Registering signs the
 * new person in, and the projects list toasts the message. A fresh install
 * doesn't send register to first setup.
 */
export default function AuthRegisterPageQuery() {
  const navigate = useNavigate();
  const { status, allowSignup } = useSignInOptions();
  const session = useSession();
  const { createAccount } = useSessionSaves();

  if (status.state !== "ready") return <AsyncBoundary status={status} titleAs="h1" />;
  // The session too, so someone signed in never sees the form or the sign-up message on the way.
  if (session.state === undefined) return <AsyncBoundary status={session.status} titleAs="h1" />;
  if (session.state === "signed_in") return <Navigate to="/projects" replace />;
  if (!allowSignup) return <PlainTextResponse>{signupDisabledMessage}</PlainTextResponse>;
  return (
    <AuthRegisterPage
      onRegister={async (values) => {
        await createAccount(values);
        void navigate("/projects", { replace: true, state: { flash: { tone: "info", message: authMessages.userCreated } } });
      }}
    />
  );
}

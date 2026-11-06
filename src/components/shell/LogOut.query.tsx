import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionSaves } from "@/api/session";
import { authMessages } from "@/constants";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import type { Flash } from "@/types/auth";
import type { ResourceStatus } from "@/types/resource";
import { errorMessage } from "@/utils/errors";

/**
 * `/users/log_out`: ends the session, then shows the login page with "Logged
 * out successfully.", as Lightning does. If Lightning can't be reached the
 * session may still be live, so it says so instead.
 */
export default function LogOut() {
  const navigate = useNavigate();
  const { signOut } = useSessionSaves();
  const [status, setStatus] = useState<ResourceStatus>({ state: "loading" });
  useEffect(() => {
    const flash: Flash = { tone: "info", message: authMessages.loggedOut };
    signOut().then(
      () => navigate("/users/log_in", { replace: true, state: { flash } }),
      (error: unknown) => setStatus({ state: "error", message: errorMessage(error) })
    );
  }, [signOut, navigate]);
  return <AsyncBoundary status={status} />;
}

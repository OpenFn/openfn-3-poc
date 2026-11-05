import type { ReactNode } from "react";
import type { Session } from "@/types/users";
import { SessionContext } from "./session";

/**
 * Supplies the signed-in user and instance details to everything below it.
 * SessionGate fills it from the API; Storybook and tests from the session
 * fixture.
 */
export default function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

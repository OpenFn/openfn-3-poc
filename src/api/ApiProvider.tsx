import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { canRetry, isSignedOut } from "./client";
import { sessionKeys } from "./session";

/**
 * TanStack Query for whatever hosts the routes: the app, Storybook. A failed
 * load is tried up to three more times, a refusal (4xx) never. `retry={false}`
 * shows a failure at once, for stories and tests. Any request answered 401
 * (the session ended) reloads the session, so SessionGate
 * sends the person to log in.
 */
export default function ApiProvider({ retry = true, children }: { retry?: boolean; children: ReactNode }) {
  const [client] = useState(() => {
    const signedOut = (error: Error, key?: readonly unknown[]) => {
      if (isSignedOut(error) && key?.[0] !== sessionKeys.all[0]) void client.invalidateQueries({ queryKey: sessionKeys.all });
    };
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({ onError: (error, query) => signedOut(error, query.queryKey) }),
      mutationCache: new MutationCache({ onError: (error) => signedOut(error) }),
      defaultOptions: { queries: { retry: (count, error) => retry && canRetry(error) && count < 3 } },
    });
    return client;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { canRetry } from "./client";

/**
 * TanStack Query for whatever hosts the routes: the app, Storybook. A failed
 * load is tried up to three more times, a refusal (4xx) never. `retry={false}`
 * shows a failure at once, for stories and tests.
 */
export default function ApiProvider({ retry = true, children }: { retry?: boolean; children: ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: (count, error) => retry && canRetry(error) && count < 3 } } })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

import { useMemo, type ReactNode } from "react";
import { useHref, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { RouterProvider, type Router } from "./router";

/** Lets the components navigate with React Router. For the demo app and Storybook. */
export function ReactRouterAdapter({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useMemo<Router>(
    () => ({ navigate: (to, opts) => void navigate(to, opts), useHref, useLocation, useSearchParams }),
    [navigate]
  );
  return <RouterProvider value={router}>{children}</RouterProvider>;
}

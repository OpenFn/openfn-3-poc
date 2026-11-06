/** Password resets on Lightning's API (api/account.md, Password resets). Signed out, so nothing is cached. */
import { useMutation } from "@tanstack/react-query";
import type { ResetPasswordValues } from "@/types/auth";
import { request } from "./client";

/** Ask for a reset link, and set a new password with one. A dead token rejects with 404 `not_found`; a refused password with 422 at `#/password`. */
export function usePasswordResetSaves() {
  const requestLink = useMutation({ mutationFn: (email: string) => request<void>("POST", "/api/password_resets", { email }) });
  const resetPassword = useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      request<void>("PUT", `/api/password_resets/${encodeURIComponent(token)}`, { password }),
  });
  return {
    request: requestLink.mutateAsync,
    reset: (token: string, { password }: ResetPasswordValues) => resetPassword.mutateAsync({ token, password }),
  };
}

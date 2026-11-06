/** Account confirmations on Lightning's API (api/account.md, Confirmations). */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import { sessionKeys } from "./session";

/**
 * Resend the confirmation email, to the signed-in user when given no email,
 * and confirm with the emailed link. A dead, used or someone else's token rejects with 404 `not_found`.
 */
export function useConfirmationSaves() {
  const queryClient = useQueryClient();
  // `void`, not `?`, so `resend()` can be called with nothing.
  const resend = useMutation({
    mutationFn: (email: string | void) => request<void>("POST", "/api/confirmations", email === undefined ? undefined : { email }),
  });
  const confirm = useMutation({
    mutationFn: (token: string) => request<void>("PUT", `/api/confirmations/${encodeURIComponent(token)}`),
    // Resolves once the session has reloaded; /api/me follows once it's `signed_in`.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
  return { resend: resend.mutateAsync, confirm: confirm.mutateAsync };
}

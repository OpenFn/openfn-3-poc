/** Account confirmations on Lightning's API (api/account.md, Confirmations). */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import { sessionKeys } from "./session";

/** Resend the confirmation email, and confirm with the emailed link. A dead, used or someone else's token rejects with 404 `not_found`. */
export function useConfirmationSaves() {
  const queryClient = useQueryClient();
  const resend = useMutation({ mutationFn: (email: string) => request<void>("POST", "/api/confirmations", { email }) });
  const confirm = useMutation({
    mutationFn: (token: string) => request<void>("PUT", `/api/confirmations/${encodeURIComponent(token)}`),
    // Resolves once the session has reloaded with `confirmed_at`.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
  return { resend: resend.mutateAsync, confirm: confirm.mutateAsync };
}

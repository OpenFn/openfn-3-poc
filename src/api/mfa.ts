/** MFA settings and backup codes on Lightning's API (api/account.md, MFA): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResourceStatus } from "@/types/resource";
import type { BackupCode } from "@/types/tokens";
import { request, statusOf } from "./client";
import { useSessionSaves } from "./session";

/** `GET /api/me/mfa`'s `data`. `backup_codes` is null unless the session is stepped up. */
export interface ApiMfa {
  enabled: boolean;
  backup_codes: { code: string; used_at: string | null }[] | null;
}

/** The API's settings as the page takes them. */
export function mfaOf(mfa: ApiMfa): { enabled: boolean; codes: BackupCode[] | null } {
  return { enabled: mfa.enabled, codes: mfa.backup_codes?.map((c) => ({ code: c.code, usedAt: c.used_at })) ?? null };
}

export const mfaKeys = { all: ["mfa"] as const };

/** Whether MFA is on, the backup codes (null until stepped up), and where loading them stands. */
export function useMfa(): { status: ResourceStatus; enabled: boolean; codes: BackupCode[] | null } {
  const query = useQuery({
    queryKey: mfaKeys.all,
    queryFn: () => request<{ data: ApiMfa }>("GET", "/api/me/mfa"),
    select: (answer) => mfaOf(answer.data),
    // As in Lightning, codes on screen stay while the page is open, even once the step-up has run out:
    // only a save reloads them. Leaving drops them, so coming back asks the server again.
    staleTime: Infinity,
    gcTime: 0,
  });
  return { status: statusOf(query), enabled: query.data?.enabled ?? false, codes: query.data?.codes ?? null };
}

/**
 * Regenerate the backup codes, and step up. Each resolves once the settings
 * have reloaded and rejects with the `ApiError`. Regenerating without a
 * stepped-up session rejects with `step_up_required`. Stepping up reloads the
 * settings too, since that is when the server sends the codes.
 */
export function useMfaSaves() {
  const queryClient = useQueryClient();
  const session = useSessionSaves();
  // A failed reload rejects: the old codes no longer work, so the page must not say it worked.
  const reload = () => queryClient.invalidateQueries({ queryKey: mfaKeys.all }, { throwOnError: true });
  const regenerate = useMutation({
    mutationFn: () => request<{ data: ApiMfa }>("POST", "/api/me/mfa/backup_codes"),
    onSuccess: reload,
  });
  return {
    regenerate: async () => void (await regenerate.mutateAsync()),
    stepUp: async (credentials: Parameters<typeof session.stepUp>[0]) => {
      await session.stepUp(credentials);
      await reload();
    },
  };
}

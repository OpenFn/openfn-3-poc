/** MFA settings and backup codes on Lightning's API (api/account.md, MFA): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MfaSetupResult } from "@/types/profile";
import type { ResourceStatus } from "@/types/resource";
import type { BackupCode } from "@/types/tokens";
import { request, statusOf } from "./client";
import { sessionKeys, useSessionSaves } from "./session";

/** `GET /api/me/mfa`'s `data`. `backup_codes` is null unless the session is stepped up. */
export interface ApiMfa {
  enabled: boolean;
  backup_codes: { code: string; used_at: string | null }[] | null;
}

/** The API's settings as the page takes them. */
export function mfaOf(mfa: ApiMfa): { enabled: boolean; codes: BackupCode[] | null } {
  return { enabled: mfa.enabled, codes: mfa.backup_codes?.map((c) => ({ code: c.code, usedAt: c.used_at })) ?? null };
}

/** `POST /api/me/mfa`'s `data`: a new secret, not saved until it comes back with a code. */
export interface ApiMfaSetup {
  secret: string;
  otpauth_uri: string;
}

export const mfaSetupOf = (setup: ApiMfaSetup): MfaSetupResult => ({ secret: setup.secret, otpauthUri: setup.otpauth_uri });

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
 * Regenerate the backup codes, step up, and set up or turn off MFA. Each
 * rejects with the `ApiError`. All but `start` resolve once the settings have
 * reloaded (confirm and disable reload you too). Regenerating without a
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
  // `mfa_enabled` is on /api/me too, and turning MFA on the first time steps the session up.
  const reloadAll = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: sessionKeys.all }), queryClient.invalidateQueries({ queryKey: mfaKeys.all })]);
  const start = useMutation({
    mutationFn: () => request<{ data: ApiMfaSetup }>("POST", "/api/me/mfa").then((answer) => mfaSetupOf(answer.data)),
  });
  const confirm = useMutation({
    mutationFn: ({ code, secret }: { code: string; secret: string }) => request("PUT", "/api/me/mfa", { secret, code }),
    onSuccess: reloadAll,
  });
  const disable = useMutation({ mutationFn: () => request<void>("DELETE", "/api/me/mfa"), onSuccess: reloadAll });
  return {
    regenerate: async () => void (await regenerate.mutateAsync()),
    stepUp: async (credentials: Parameters<typeof session.stepUp>[0]) => {
      await session.stepUp(credentials);
      await reload();
    },
    start: () => start.mutateAsync(),
    confirm: async (code: string, secret: string) => void (await confirm.mutateAsync({ code, secret })),
    disable: () => disable.mutateAsync(),
  };
}

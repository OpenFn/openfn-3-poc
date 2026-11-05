/**
 * Personal access tokens and MFA backup codes for the signed-in user
 * (/profile/tokens, /profile/auth/backup_codes). Static fixtures only:
 * every value is an obviously fake placeholder, never a real secret.
 */
import type { ApiToken, BackupCode } from "@/types/tokens";

export const apiTokens: ApiToken[] = [
  {
    id: "token-1",
    masked: "...bCdE-12345",
    insertedAt: "2026-10-14T08:12:00Z",
    lastUsedAt: null,
  },
  {
    id: "token-2",
    masked: "...yXwV-67890",
    insertedAt: "2026-09-02T14:30:00Z",
    lastUsedAt: "2026-10-12T16:05:00Z",
  },
];

/** Ten placeholder recovery codes, nine characters like Lightning's; one already used. */
export const backupCodes: BackupCode[] = [
  "demo00001", "demo00002", "demo00003", "demo00004", "demo00005",
  "demo00006", "demo00007", "demo00008", "demo00009", "demo00010",
].map((code, i) => ({ code, usedAt: i === 2 ? "2026-09-18T10:41:07Z" : null }));

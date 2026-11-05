/** MFA settings and backup codes on the pretend server (api/account.md, MFA). */
import { backupCodes } from "@/mock-data/tokens";
import { json, now, problem, type Handler } from "./answers";
// session.ts imports this file too, for signing in with a backup code; each side only calls the other inside handlers, so the cycle is safe.
import { currentUser, isSteppedUp } from "./session";

// ponytail: one set of codes, whoever is signed in; key them by user if a test ever signs in as two MFA users.
const seed = () => backupCodes.map((c) => ({ code: c.code, used_at: c.usedAt }));
let codes = seed();

/** For stories and tests: the starting codes. */
export const resetMfa = () => {
  codes = seed();
};

/** Signing in with a backup code: true if it's one of the codes and not used yet, which it then is. */
export function spendBackupCode(code: string): boolean {
  const found = codes.find((c) => c.code === code && c.used_at === null);
  if (found) found.used_at = now();
  return Boolean(found);
}

const settings = () => ({ data: { enabled: currentUser().mfaEnabled, backup_codes: isSteppedUp() ? codes : null } });

// Lightning's codes are nine characters.
const newCode = () => crypto.randomUUID().replace(/-/g, "").slice(0, 9).toUpperCase();

export const mfaRoutes: Record<string, Handler> = {
  "GET /api/me/mfa": () => json(200, settings()),
  "POST /api/me/mfa/backup_codes": () => {
    if (!isSteppedUp()) {
      return problem({ status: 403, code: "step_up_required", detail: "Enter your password or an MFA code again to do this." });
    }
    codes = Array.from({ length: 10 }, () => ({ code: newCode(), used_at: null }));
    return json(201, settings());
  },
};

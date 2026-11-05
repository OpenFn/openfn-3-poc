/** MFA settings and backup codes on the pretend server (api/account.md, MFA). */
import { backupCodes } from "@/mock-data/tokens";
import { invalid, json, noContent, now, stepUpRequired, type Handler } from "./answers";
// session.ts imports this file too, for signing in with a backup code; each side only calls the other inside handlers, so the cycle is safe.
import { currentUser, FAKE_MFA_CODE, isSteppedUp, stepUpSession } from "./session";

// ponytail: one set of codes, whoever is signed in; key them by user if a test ever signs in as two MFA users.
const seed = () => backupCodes.map((c) => ({ code: c.code, used_at: c.usedAt }));
let codes = seed();
// Who has codes from an earlier setup: turning MFA off keeps them, so turning it on again makes no new ones.
const keptCodes = new Set<string>();

/** For stories and tests: the starting codes. */
export const resetMfa = () => {
  codes = seed();
  keptCodes.clear();
};

/** Signing in with a backup code: true if it's one of the codes and not used yet, which it then is. */
export function spendBackupCode(code: string): boolean {
  const found = codes.find((c) => c.code === code && c.used_at === null);
  if (found) found.used_at = now();
  return Boolean(found);
}

const settings = () => ({ data: { enabled: currentUser().mfaEnabled, backup_codes: isSteppedUp() ? codes : null } });

// Lightning's codes are nine characters.
const newCodes = () => Array.from({ length: 10 }, () => ({ code: crypto.randomUUID().replace(/-/g, "").slice(0, 9).toUpperCase(), used_at: null }));

// A base32 secret, as NimbleTOTP makes; every code the fake accepts is FAKE_MFA_CODE anyway.
const newSecret = () => Array.from({ length: 32 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");

export const mfaRoutes: Record<string, Handler> = {
  "GET /api/me/mfa": () => json(200, settings()),
  // Nothing is saved until PUT sends the secret back with a code.
  "POST /api/me/mfa": () => {
    const secret = newSecret();
    const label = encodeURIComponent(`OpenFn:${currentUser().email}`);
    return json(201, { data: { secret, otpauth_uri: `otpauth://totp/${label}?secret=${secret}&issuer=OpenFn` } });
  },
  "PUT /api/me/mfa": (_params, body) => {
    // Lightning's two wordings, both `mismatch` on the API.
    const code = String(body["code"] ?? "");
    if (code !== FAKE_MFA_CODE) {
      return invalid([{ code: "mismatch", detail: /^\d{6}$/.test(code) ? "invalid code" : "should be a 6 digit number", pointer: "#/code" }]);
    }
    const me = currentUser();
    // Turning it on steps the session up so the app can show the codes; the first time also makes ten.
    if (!me.mfaEnabled) {
      if (!keptCodes.has(me.id)) codes = newCodes();
      stepUpSession();
    }
    me.mfaEnabled = true;
    return json(200, settings());
  },
  "DELETE /api/me/mfa": () => {
    if (!isSteppedUp()) return stepUpRequired();
    const me = currentUser();
    me.mfaEnabled = false;
    keptCodes.add(me.id);
    return noContent();
  },
  "POST /api/me/mfa/backup_codes": () => {
    if (!isSteppedUp()) return stepUpRequired();
    codes = newCodes();
    return json(201, settings());
  },
};

/** The email-confirmation lockout and the resend allowance, on the pretend server (api/account.md). */
import { authConfig } from "@/mock-data/auth";
import type { User } from "@/types/users";

/** How long after sign-up an unconfirmed account keeps working (Accounts.locked_out?/1). */
const GRACE_MS = 48 * 3_600_000;
const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 15 * 60_000;

export const lockedOut = (user: User) =>
  authConfig.requireEmailVerification && !user.confirmedAt && Date.now() - Date.parse(user.insertedAt) > GRACE_MS;

/** What a locked-out session can still reach: its session, the instance, resending and confirming (docs/api-gaps.md, Confirm account). */
export const openWhileLockedOut = new Set([
  "GET /api/session",
  "POST /api/session",
  "DELETE /api/session",
  "GET /api/instance",
  "POST /api/confirmations",
  "PUT /api/confirmations/:token",
]);

// ponytail: in memory, so a reload refills every allowance; Lightning keeps it in its Hammer bucket.
const resends = new Map<string, number[]>();

export const resetResends = () => resends.clear();

/** Spends one of the user's resends; false once the allowance is spent. */
export function spendResend(userId: string): boolean {
  const recent = (resends.get(userId) ?? []).filter((at) => at > Date.now() - RESEND_WINDOW_MS);
  if (recent.length >= RESEND_LIMIT) return false;
  resends.set(userId, [...recent, Date.now()]);
  return true;
}

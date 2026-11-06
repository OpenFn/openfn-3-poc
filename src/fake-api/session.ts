/**
 * The fake server's session (api/account.md, Sessions; api/authentication.md,
 * session tokens). Who is signed in lives in localStorage, standing in for
 * Lightning's session cookie, so a reload keeps you signed in. With nothing
 * stored it starts signed in as the first fixture user, as if the cookie were
 * already set.
 */
import { backupCodes } from "@/mock-data/tokens";
import { hasActivityInProjects } from "@/mock-data/profile";
import { users } from "@/mock-data/users";
import type { User } from "@/types/users";
import { accepted, invalid, json, noContent, notFound, now, problem, ORIGIN, type Handler, type Problem } from "./answers";
import { lockedOut, openWhileLockedOut, resetResends, spendResend } from "./lockout";
import { spendBackupCode } from "./mfa";

/**
 * The password every fixture user signs in with (the same as Lightning's demo
 * seed), their MFA code, and a backup code. The password or the MFA code also
 * steps a signed-in session up. Not real secrets.
 */
export const FAKE_PASSWORD = "welcome12345";
export const FAKE_MFA_CODE = "123456";
// The first of the fake's backup codes; signing in with it marks it used.
export const FAKE_BACKUP_CODE = backupCodes[0]!.code;
/** The one reset link the fake knows: it sets Esther's (editor@openfn.org) password, once until a reload or reset. */
export const FAKE_RESET_TOKEN = "fake-reset-token";
/** The one confirm link the fake knows: it confirms Una's account (unconfirmed@openfn.org), once until a reload or reset. */
export const FAKE_CONFIRM_TOKEN = "fake-confirm-token";

/** How long a step-up lasts (api/authentication.md, session tokens). */
const STEP_UP_MS = 5 * 60_000;
const KEY = "fake-api:session";

/** The cookie: who is signed in, or who has passed the password and still owes an MFA code. */
interface Cookie {
  userId: string | null;
  mfaPendingId: string | null;
  csrf: string;
}

const signedInAs = (userId: string): Cookie => ({ userId, mfaPendingId: null, csrf: `fake-csrf-${crypto.randomUUID()}` });
const DEFAULT: Cookie = { userId: users[0]!.id, mfaPendingId: null, csrf: "fake-csrf-token" };
const SIGNED_OUT: Cookie = { userId: null, mfaPendingId: null, csrf: "" };

// No localStorage (a test outside the browser): the cookie only lasts while the module does.
let memory: Cookie = DEFAULT;
// A stored cookie that can't be read, or names a user the fixtures no longer have, starts over as the default.
const read = (): Cookie => {
  if (!globalThis.localStorage) return memory;
  try {
    const cookie = JSON.parse(globalThis.localStorage.getItem(KEY) ?? "null") as Cookie | null;
    const known = (id: string | null) => id === null || people.some((u) => u.id === id);
    return cookie && known(cookie.userId) && known(cookie.mfaPendingId) ? cookie : DEFAULT;
  } catch {
    return DEFAULT;
  }
};
const write = (cookie: Cookie) => {
  memory = cookie;
  globalThis.localStorage?.setItem(KEY, JSON.stringify(cookie));
};

let steppedUpUntil = 0;

// The users table: copies, so a profile change lasts until the next reset.
const seedPeople = (): User[] => users.map((u) => ({ ...u }));
/** Every user, as the fake server holds them. */
export let people = seedPeople();
/** New addresses waiting for their confirmation link (which the fake never sends), by user id. */
export const pendingEmails = new Map<string, string>();

/** New passwords, by user id; everyone else signs in with FAKE_PASSWORD. */
const passwords = new Map<string, string>();
export const setPassword = (userId: string, password: string) => void passwords.set(userId, password);
const passwordOf = (userId: string) => passwords.get(userId) ?? FAKE_PASSWORD;
let resetTokenUsed = false;

/** A new password's problems, as a 422 lists them: 12 to 72 characters. */
export function passwordErrors(password: unknown): NonNullable<Problem["errors"]> {
  if (typeof password !== "string" || password.length < 12) {
    return [{ code: "too_short", detail: "should be at least 12 character(s)", pointer: "#/password" }];
  }
  if (password.length > 72) return [{ code: "too_long", detail: "should be at most 72 character(s)", pointer: "#/password" }];
  return [];
}

/** Back to the first fixture user, signed in and not stepped up, with the fixtures' users. */
export function resetSession() {
  memory = DEFAULT;
  globalThis.localStorage?.removeItem(KEY);
  steppedUpUntil = 0;
  people = seedPeople();
  pendingEmails.clear();
  passwords.clear();
  resetResends();
  resetTokenUsed = false;
}

/** Signs this browser in as the user, replacing any session, as a create that signs the person in does. */
export function startSession(userId: string) {
  write(signedInAs(userId));
  steppedUpUntil = 0;
}

/** Ends this browser's session, as signing out does. */
export function endSession() {
  write(SIGNED_OUT);
  steppedUpUntil = 0;
}

/** The signed-in user. Only for routes behind `refuse`, which answers 401 when there isn't one. */
export function currentUser(): User {
  const user = people.find((u) => u.id === read().userId);
  if (!user) throw new Error("currentUser is for routes that need a session");
  return user;
}

/** Whether someone is signed in, past any MFA code. */
export const isSignedIn = () => Boolean(read().userId);

/** Whether the session was stepped up in the last five minutes. */
export const isSteppedUp = () => steppedUpUntil > Date.now();

const sessionData = () => {
  const { userId, mfaPendingId, csrf } = read();
  return {
    data: {
      state: userId ? (lockedOut(currentUser()) ? "confirmation_required" : "signed_in") : "mfa_required",
      user_id: userId ?? mfaPendingId,
      stepped_up_until: isSteppedUp() ? new Date(steppedUpUntil).toISOString() : null,
      csrf_token: csrf,
      pending_signup: null,
    },
  };
};

// Every refused sign-in or step-up is the same 401, whatever was wrong.
const invalidCredentials = () =>
  problem({ status: 401, code: "invalid_credentials", detail: "The email, password or code is not valid." });
export const unauthenticated = () => problem({ status: 401, code: "unauthenticated", detail: "You must sign in first." });

const codeIsGood = (body: Record<string, unknown>) =>
  body["mfa_code"] === FAKE_MFA_CODE || (typeof body["backup_code"] === "string" && spendBackupCode(body["backup_code"]));

function signIn(body: Record<string, unknown>) {
  const { mfaPendingId } = read();
  // The second step: only the code, for the person who passed the password.
  if (body["email"] === undefined && mfaPendingId) {
    if (!codeIsGood(body)) return invalidCredentials();
    startSession(mfaPendingId);
    return json(201, sessionData());
  }
  const user = people.find((u) => u.email === body["email"]);
  if (!user || user.disabled || body["password"] !== passwordOf(user.id)) return invalidCredentials();
  if (user.mfaEnabled && !codeIsGood(body)) {
    steppedUpUntil = 0;
    write({ userId: null, mfaPendingId: user.id, csrf: `fake-csrf-${crypto.randomUUID()}` });
    return problem({ status: 401, code: "mfa_required", detail: "Enter the code from your authenticator app." });
  }
  startSession(user.id);
  return json(201, sessionData());
}

/** Steps the session up for five minutes, as turning MFA on for the first time does. */
export function stepUpSession() {
  steppedUpUntil = Date.now() + STEP_UP_MS;
}

function stepUp(body: Record<string, unknown>) {
  // The password or an MFA code steps the session up for five minutes. A backup code doesn't.
  const ok = body["password"] !== undefined ? body["password"] === passwordOf(currentUser().id) : body["mfa_code"] === FAKE_MFA_CODE;
  if (!ok) return invalidCredentials();
  stepUpSession();
  return json(201, sessionData());
}

/**
 * What every request answers before its route, or nothing to go on: 401
 * without a session (except the routes for signing in) or while locked out
 * (except `openWhileLockedOut`), and 403 for a write whose `x-csrf-token`
 * isn't the session's (api/errors.md has no code for it, so `forbidden`).
 */
export function refuse(route: string, headers: Headers): Response | undefined {
  const { userId, mfaPendingId, csrf } = read();
  // Need no token (api/account.md): they answer signed out and while an MFA code is owed.
  const tokenless =
    route === "GET /api/instance" ||
    route === "POST /api/password_resets" ||
    route === "PUT /api/password_resets/:token" ||
    route === "POST /api/confirmations" ||
    route === "POST /api/users";
  const open = tokenless || route === "POST /api/session" || route === "DELETE /api/session";
  const hasSession = Boolean(userId || mfaPendingId);
  if (!hasSession) return open ? undefined : unauthenticated();
  if (!route.startsWith("GET ") && headers.get("x-csrf-token") !== csrf) {
    return problem({ status: 403, code: "forbidden", detail: "The request's CSRF token is missing or wrong." });
  }
  // Waiting for an MFA code: only the session routes and the tokenless ones answer.
  if (!userId && !route.endsWith(" /api/session") && !tokenless) return unauthenticated();
  if (userId && !openWhileLockedOut.has(route) && lockedOut(currentUser())) return unauthenticated();
  return undefined;
}

/** The users.md user object, with its planned additional scope. */
export const userJson = (u: User) => ({
  data: {
    type: "users",
    id: u.id,
    attributes: {
      email: u.email,
      first_name: u.firstName,
      last_name: u.lastName,
      role: u.role,
      support_user: u.supportUser,
      disabled: u.disabled,
      scheduled_deletion: u.scheduledDeletion,
    },
    links: { self: `${ORIGIN}/api/users/${u.id}` },
  },
});

/** The user object with the extras a session token adds (api/account.md, Get the current user). */
export const meJson = (u: User) => ({
  data: {
    ...userJson(u).data,
    attributes: {
      ...userJson(u).data.attributes,
      has_activity_in_projects: hasActivityInProjects,
      mfa_enabled: u.mfaEnabled,
      has_password: true,
      inserted_at: u.insertedAt,
      confirmed_at: u.confirmedAt,
      contact_preference: u.contactPreference,
      experimental_features: u.experimentalFeatures,
      pending_email: pendingEmails.get(u.id) ?? null,
      identities: [],
      github: { connected: u.githubConnected, expires_at: null },
      ai_disclaimer_accepted_at: null,
      consent: null,
    },
  },
});

export const sessionRoutes: Record<string, Handler> = {
  "GET /api/session": () => json(200, sessionData()),
  // With an email it's a sign-in, whoever was signed in before; without one, a signed-in session steps up.
  "POST /api/session": (_params, body) => (read().userId && body["email"] === undefined ? stepUp(body) : signIn(body)),
  "DELETE /api/session": () => {
    endSession();
    return noContent();
  },

  // Answers the same whether or not the email has an account. The fake sends nothing.
  "POST /api/password_resets": accepted,
  // ponytail: Lightning also ends the person's other sessions and API tokens; the fake keeps them.
  "PUT /api/password_resets/:token": ({ token }, body) => {
    if (token !== FAKE_RESET_TOKEN || resetTokenUsed) return notFound();
    const errors = passwordErrors(body["password"]);
    if (errors.length) return invalid(errors);
    resetTokenUsed = true;
    setPassword(people.find((u) => u.email === "editor@openfn.org")!.id, body["password"] as string);
    return noContent();
  },

  // By email it always answers 202. Signed in without one, the fourth in 15 minutes is refused.
  "POST /api/confirmations": (_params, body) => {
    const { userId } = read();
    if (body["email"] !== undefined) {
      const user = people.find((u) => u.email === body["email"]);
      if (user) spendResend(user.id);
    } else if (userId && !spendResend(userId)) {
      return problem({ status: 429, code: "too_many_requests", detail: "Too many requests. Try again later." });
    }
    return accepted();
  },
  // ponytail: only the account link is faked; email-change and credential-transfer tokens answer 404 until a page needs them.
  "PUT /api/confirmations/:token": ({ token }) => {
    const user = currentUser();
    if (token !== FAKE_CONFIRM_TOKEN || user.email !== "unconfirmed@openfn.org" || user.confirmedAt) {
      return notFound();
    }
    user.confirmedAt = now();
    return json(200, { data: { confirmed: "account" } });
  },

  "GET /api/me": () => json(200, meJson(currentUser())),
};

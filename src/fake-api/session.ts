/**
 * The fake server's session (api/account.md, Sessions; api/authentication.md,
 * session tokens). Who is signed in lives in localStorage, standing in for
 * Lightning's session cookie, so a reload keeps you signed in. With nothing
 * stored it starts signed in as the first fixture user, as if the cookie were
 * already set.
 */
import { authConfig } from "@/mock-data/auth";
import { backupCodes } from "@/mock-data/tokens";
import { session as sessionFixture, users } from "@/mock-data/users";
import type { User } from "@/types/users";
import { json, noContent, problem, ORIGIN, type Handler } from "./answers";
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
    const known = (id: string | null) => id === null || users.some((u) => u.id === id);
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

/** Back to the first fixture user, signed in and not stepped up. */
export function resetSession() {
  memory = DEFAULT;
  globalThis.localStorage?.removeItem(KEY);
  steppedUpUntil = 0;
}

/** The signed-in user. Only for routes behind `refuse`, which answers 401 when there isn't one. */
export function currentUser(): User {
  const user = users.find((u) => u.id === read().userId);
  if (!user) throw new Error("currentUser is for routes that need a session");
  return user;
}

/** Whether the session was stepped up in the last five minutes. */
export const isSteppedUp = () => steppedUpUntil > Date.now();

const sessionData = () => {
  const { userId, mfaPendingId, csrf } = read();
  return {
    data: {
      state: userId ? "signed_in" : "mfa_required",
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
const unauthenticated = () => problem({ status: 401, code: "unauthenticated", detail: "You must sign in first." });

const codeIsGood = (body: Record<string, unknown>) =>
  body["mfa_code"] === FAKE_MFA_CODE || (typeof body["backup_code"] === "string" && spendBackupCode(body["backup_code"]));

function signIn(body: Record<string, unknown>) {
  const { mfaPendingId } = read();
  // The second step: only the code, for the person who passed the password.
  if (body["email"] === undefined && mfaPendingId) {
    if (!codeIsGood(body)) return invalidCredentials();
    steppedUpUntil = 0;
    write(signedInAs(mfaPendingId));
    return json(201, sessionData());
  }
  const user = users.find((u) => u.email === body["email"]);
  if (!user || user.disabled || body["password"] !== FAKE_PASSWORD) return invalidCredentials();
  if (user.mfaEnabled && !codeIsGood(body)) {
    steppedUpUntil = 0;
    write({ userId: null, mfaPendingId: user.id, csrf: `fake-csrf-${crypto.randomUUID()}` });
    return problem({ status: 401, code: "mfa_required", detail: "Enter the code from your authenticator app." });
  }
  steppedUpUntil = 0;
  write(signedInAs(user.id));
  return json(201, sessionData());
}

function stepUp(body: Record<string, unknown>) {
  // The password or an MFA code steps the session up for five minutes. A backup code doesn't.
  const ok = body["password"] !== undefined ? body["password"] === FAKE_PASSWORD : body["mfa_code"] === FAKE_MFA_CODE;
  if (!ok) return invalidCredentials();
  steppedUpUntil = Date.now() + STEP_UP_MS;
  return json(201, sessionData());
}

/**
 * What every request answers before its route, or nothing to go on: 401
 * without a session (except the routes for signing in), and 403 for a write
 * whose `x-csrf-token` isn't the session's. api/errors.md has no code of its
 * own for a bad CSRF token, so it's `forbidden`.
 */
export function refuse(route: string, headers: Headers): Response | undefined {
  const { userId, mfaPendingId, csrf } = read();
  const open = route === "GET /api/instance" || route === "POST /api/session" || route === "DELETE /api/session";
  const hasSession = Boolean(userId || mfaPendingId);
  if (!hasSession) return open ? undefined : unauthenticated();
  if (!route.startsWith("GET ") && headers.get("x-csrf-token") !== csrf) {
    return problem({ status: 403, code: "forbidden", detail: "The request's CSRF token is missing or wrong." });
  }
  // Waiting for an MFA code: only the session routes answer.
  if (!userId && !route.endsWith(" /api/session") && route !== "GET /api/instance") return unauthenticated();
  return undefined;
}

export const sessionRoutes: Record<string, Handler> = {
  "GET /api/session": () => json(200, sessionData()),
  // With an email it's a sign-in, whoever was signed in before; without one, a signed-in session steps up.
  "POST /api/session": (_params, body) => (read().userId && body["email"] === undefined ? stepUp(body) : signIn(body)),
  "DELETE /api/session": () => {
    write(SIGNED_OUT);
    steppedUpUntil = 0;
    return noContent();
  },

  // The users.md user object, with the extras a session token adds (api/account.md, Get the current user).
  "GET /api/me": () => {
    const u = currentUser();
    return json(200, {
      data: {
        type: "users",
        id: u.id,
        attributes: {
          email: u.email,
          first_name: u.firstName,
          last_name: u.lastName,
          role: u.role,
          // Planned additional scope on the user object.
          support_user: u.supportUser,
          disabled: u.disabled,
          scheduled_deletion: u.scheduledDeletion,
          has_activity_in_projects: false,
          // What a session token adds.
          mfa_enabled: u.mfaEnabled,
          has_password: true,
          inserted_at: u.insertedAt,
          confirmed_at: u.confirmedAt,
          contact_preference: u.contactPreference,
          experimental_features: u.experimentalFeatures,
          pending_email: null,
          identities: [],
          github: { connected: u.githubConnected, expires_at: null },
          ai_disclaimer_accepted_at: null,
          consent: null,
        },
        links: { self: `${ORIGIN}/api/users/${u.id}` },
      },
    });
  },

  "GET /api/instance": () => {
    const signedIn = Boolean(read().userId);
    const provider = authConfig.ssoProvider;
    return json(200, {
      data: {
        needs_setup: false,
        allow_signup: authConfig.allowSignup,
        url: ORIGIN,
        release: { label: sessionFixture.instance.releaseLabel, commit: null, image_tag: null, branch: null },
        admin_email: signedIn ? sessionFixture.instance.adminEmail : null,
        purge_deleted_after_days: 7,
        sign_in_providers: provider ? [{ name: provider.name, kind: "external", start_url: `${ORIGIN}${provider.handlerUrl}` }] : [],
        ai_assistant: true,
        github_sync: false,
        github_connect_url: null,
      },
    });
  },
};

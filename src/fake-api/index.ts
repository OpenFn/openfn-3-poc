/**
 * A pretend Lightning server, so the app runs with no backend. `fakeFetch`
 * takes the same arguments as `fetch` and answers as api/ says Lightning
 * would: status codes, JSON bodies, and problem documents for refusals
 * (api/errors.md), after a short wait. The fixtures in src/mock-data/ are its
 * database. Only src/api/client.ts imports this folder; going real deletes it.
 */
import { session } from "@/mock-data/users";
import { apiTokens } from "@/mock-data/tokens";
import credentials from "./recorded/credentials.json";
import { json, noContent, now, problem, type Body, type Handler, type Problem } from "./answers";
import { projectRoutes, resetProjects } from "./projects";
import { auditRoutes } from "./audit";

export type { Problem } from "./answers";


/**
 * The fake user's password and MFA code, for signing in and stepping up. The
 * fake user is the session fixture's (demo@openfn.org). Not real secrets.
 */
export const FAKE_PASSWORD = "fake-password-not-real";
export const FAKE_MFA_CODE = "123456";

const WAIT_MS = 300;
/** How long a step-up lasts (api/authentication.md, session tokens). */
const STEP_UP_MS = 5 * 60_000;

type StoredToken = { id: string; token: string; inserted_at: string; last_used_at: string | null };

// The database, and the session's step-up.

const seed = (): StoredToken[] =>
  apiTokens.map((t) => ({ id: t.id, token: t.masked, inserted_at: t.insertedAt, last_used_at: t.lastUsedAt }));

let tokens = seed();
let steppedUpUntil = 0;
const failures = new Map<string, Problem>();

// Lightning's `mask_token`: "..." and the last ten characters.
const mask = (token: string) => "..." + token.slice(-10);

const sessionData = () => ({
  data: {
    state: "signed_in",
    user_id: session.user.id,
    stepped_up_until: steppedUpUntil > Date.now() ? new Date(steppedUpUntil).toISOString() : null,
    csrf_token: "fake-csrf-token",
    pending_signup: null,
  },
});

// Every refused sign-in or step-up is the same 401, whatever was wrong.
const invalidCredentials = () =>
  problem({ status: 401, code: "invalid_credentials", detail: "The email, password or code is not valid." });

const routes: Record<string, Handler> = {
  "GET /api/session": () => json(200, sessionData()),
  "POST /api/session": (_params, body) => {
    // Signing in: the fake is always signed in as the session fixture's user, so this only checks the details.
    if (body["email"] !== undefined) {
      return body["email"] === session.user.email && body["password"] === FAKE_PASSWORD ? json(201, sessionData()) : invalidCredentials();
    }
    // Signed in, the password or an MFA code again steps the session up for five minutes. A backup code doesn't.
    const ok = body["password"] !== undefined ? body["password"] === FAKE_PASSWORD : body["mfa_code"] === FAKE_MFA_CODE;
    if (!ok) return invalidCredentials();
    steppedUpUntil = Date.now() + STEP_UP_MS;
    return json(201, sessionData());
  },

  // Newest first, masked, not paged.
  "GET /api/me/tokens": () => json(200, { data: tokens }),
  // Needs a stepped-up session. The whole token, this once; the list keeps only its mask.
  "POST /api/me/tokens": () => {
    if (steppedUpUntil <= Date.now()) {
      return problem({ status: 403, code: "step_up_required", detail: "Enter your password or an MFA code again to do this." });
    }
    const created = { id: crypto.randomUUID(), token: `demo.fake-token-not-real.${crypto.randomUUID()}`, inserted_at: now(), last_used_at: null };
    tokens = [{ ...created, token: mask(created.token) }, ...tokens];
    return json(201, { data: created });
  },
  "DELETE /api/me/tokens/:id": ({ id }) => {
    if (!tokens.some((t) => t.id === id)) return problem({ status: 404, code: "not_found", detail: "Not found." });
    tokens = tokens.filter((t) => t.id !== id);
    return noContent();
  },

  // Answers recorded from a real Lightning, replayed as they are.
  "GET /api/credentials": () => json(200, credentials),

  ...projectRoutes,
  ...auditRoutes,
};

/** The route a path matches (`"DELETE /api/me/tokens/:id"`) and its path parameters. */
function match(method: string, path: string): [string, Record<string, string>] | undefined {
  for (const key of Object.keys(routes)) {
    const [routeMethod, pattern] = key.split(" ") as [string, string];
    if (routeMethod !== method) continue;
    const names: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, name: string) => (names.push(name), "([^/]+)")) + "$");
    const found = regex.exec(path);
    if (found) return [key, Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(found[i + 1]!)]))];
  }
  return undefined;
}

/** Answers a request as Lightning would. Same arguments as `fetch`, for paths under /api. */
export async function fakeFetch(input: string, init: RequestInit = {}): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, WAIT_MS));
  const [path, search = ""] = input.split("?") as [string, string?];
  const found = match(init.method ?? "GET", path);
  // Unknown routes are a 404 problem document (api/errors.md).
  if (!found) return problem({ status: 404, code: "not_found", detail: `The fake server has no route for ${init.method ?? "GET"} ${path}.` });
  const [key, params] = found;
  const failure = failures.get(key);
  if (failure) {
    failures.delete(key);
    return problem(failure);
  }
  const body = typeof init.body === "string" ? (JSON.parse(init.body) as Body) : {};
  return routes[key]!(params, body, new URLSearchParams(search));
}

/** For stories and tests: the next request to this route (`"POST /api/me/tokens"`) is refused with this problem. */
export function failNext(route: string, failure: Problem) {
  failures.set(route, failure);
}

/** For stories and tests: the starting data, not stepped up, nothing set to fail. */
export function resetFakeApi() {
  tokens = seed();
  resetProjects();
  steppedUpUntil = 0;
  failures.clear();
}

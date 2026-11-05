/**
 * A pretend Lightning server, so the app runs with no backend. `fakeFetch`
 * takes the same arguments as `fetch` and answers as api/ says Lightning
 * would: status codes, JSON bodies, and problem documents for refusals
 * (api/errors.md), after a short wait. The fixtures in src/mock-data/ are its
 * database. Only src/api/client.ts imports this folder; going real deletes it.
 */
import { apiTokens } from "@/mock-data/tokens";
import credentials from "./recorded/credentials.json";
import { json, noContent, now, problem, type Body, type Handler, type Problem } from "./answers";
import { projectRoutes, resetProjects } from "./projects";
import { isSteppedUp, refuse, resetSession, sessionRoutes } from "./session";

export type { Problem } from "./answers";
export { FAKE_BACKUP_CODE, FAKE_MFA_CODE, FAKE_PASSWORD } from "./session";

const WAIT_MS = 300;

type StoredToken = { id: string; token: string; inserted_at: string; last_used_at: string | null };

// The database.

const seed = (): StoredToken[] =>
  apiTokens.map((t) => ({ id: t.id, token: t.masked, inserted_at: t.insertedAt, last_used_at: t.lastUsedAt }));

let tokens = seed();
const failures = new Map<string, Problem>();

// Lightning's `mask_token`: "..." and the last ten characters.
const mask = (token: string) => "..." + token.slice(-10);

const routes: Record<string, Handler> = {
  ...sessionRoutes,

  // Newest first, masked, not paged.
  "GET /api/me/tokens": () => json(200, { data: tokens }),
  // Needs a stepped-up session. The whole token, this once; the list keeps only its mask.
  "POST /api/me/tokens": () => {
    if (!isSteppedUp()) {
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
  const refused = refuse(key, new Headers(init.headers));
  if (refused) return refused;
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

/** For stories and tests: the starting data, signed in as the first fixture user, not stepped up, nothing set to fail. */
export function resetFakeApi() {
  tokens = seed();
  resetProjects();
  resetSession();
  failures.clear();
}

/**
 * The one way the app reaches Lightning's API. With `VITE_API=lightning` it
 * calls a real Lightning through Vite's `/api` proxy (vite.config.ts), on
 * Lightning's session cookie; otherwise the pretend server in `src/fake-api/`,
 * which answers the same way. Swapping `fetch` here is the only place the app
 * knows the fake exists. A refused request throws an `ApiError`: show its
 * `message`, branch on its `code`.
 */
import type { ResourceStatus } from "@/types/resource";
import { RequestError } from "@/utils/errors";
// Decided when the app is built, so a build for real Lightning leaves the fake out entirely.
const send: (path: string, init?: RequestInit) => Promise<Response> =
  import.meta.env.VITE_API === "lightning" ? fetch : async (path, init) => (await import("@/fake-api")).fakeFetch(path, init);

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// The session's CSRF token, which every write sends (api/authentication.md,
// session tokens). Asked for once, on the first write; null when signed out.
let csrfToken: Promise<string | null> | null = null;
const csrf = () =>
  (csrfToken ??= request<{ data: { csrf_token: string } }>("GET", "/api/session").then(
    (answer) => answer.data.csrf_token,
    (error: unknown) => {
      csrfToken = null;
      if (isSignedOut(error)) return null;
      throw error;
    }
  ));

/** Forget the CSRF token, so the next write asks for the session's. For tests that change the session behind the client's back. */
export function forgetCsrfToken() {
  csrfToken = null;
}

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  if (method === "GET") return call<T>(method, path, body, null);
  try {
    return await call<T>(method, path, body, await csrf());
  } catch (error) {
    // The token may be from a session that changed elsewhere: the next write asks again. Never resent
    // here: the new session may be someone else's.
    if (isApiError(error, "forbidden")) csrfToken = null;
    throw error;
  } finally {
    // Signing in or out starts a new session, with a new token.
    if (path === "/api/session") csrfToken = null;
  }
}

async function call<T>(method: Method, path: string, body: unknown, token: string | null): Promise<T> {
  let response: Response;
  try {
    response = await send(path, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { "x-csrf-token": token } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "unreachable", "Couldn't reach Lightning.");
  }
  // 204 has no body; a proxy's error page isn't JSON.
  const json: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) throw toApiError(response.status, json);
  return json as T;
}

/** Every page of a paged list (api/conventions.md), following `links.next`. */
export async function listAll<T>(path: string, key: string): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = `${path}${path.includes("?") ? "&" : "?"}page_size=100`;
  while (next) {
    const page: Record<string, unknown> & { links?: { next: string | null } } = await request("GET", next);
    rows.push(...(page[key] as T[]));
    // Lightning's links are absolute; keep them on this origin so they go through the proxy.
    const url: URL | null = page.links?.next ? new URL(page.links.next) : null;
    next = url ? url.pathname + url.search : null;
  }
  return rows;
}

// Errors.

/** One entry of a problem document's `errors` (api/errors.md): a `code`, a `detail` and one location. */
export interface ProblemEntry {
  code: string;
  detail: string;
  pointer?: string;
  parameter?: string;
  header?: string;
  path?: string;
}

/**
 * A request Lightning refused. Show `message` (the problem's `detail`) and
 * branch on `code`, never on the wording. Entries with a body pointer
 * become `fieldErrors`, keyed by the pointer without `#/` (`#/name` → `name`,
 * `#/members/0/email` → `members.0.email`).
 */
export class ApiError extends RequestError {
  readonly code: string;
  readonly errors: ProblemEntry[];

  constructor(status: number, code: string, detail: string, errors: ProblemEntry[] = []) {
    const fieldErrors: Record<string, string[]> = {};
    for (const e of errors) {
      if (!e.pointer) continue;
      const key = e.pointer.replace(/^#\//, "").replaceAll("/", ".");
      (fieldErrors[key] ??= []).push(e.detail);
    }
    super(detail, { status, fieldErrors });
    this.name = "ApiError";
    this.code = code;
    this.errors = errors;
  }
}

// For an answer that isn't a problem document (a proxy's 502, an empty body).
const codeForStatus: Record<number, string> = { 401: "unauthenticated", 403: "forbidden", 404: "not_found" };

/** An error status and its body (a problem document, or anything else) as an ApiError. */
export function toApiError(status: number, body: unknown): ApiError {
  const problem = (typeof body === "object" && body !== null ? body : {}) as Partial<{ code: string; detail: string; title: string; errors: ProblemEntry[] }>;
  return new ApiError(
    status,
    problem.code ?? codeForStatus[status] ?? "internal",
    problem.detail ?? problem.title ?? `Lightning answered ${status}.`,
    Array.isArray(problem.errors) ? problem.errors : []
  );
}


/**
 * A refusal with each pointer's field renamed (`#/project_credentials/0/project_id` → `#/projectIds`),
 * so it lands on a form field with another name: the forms project settings
 * shares keep their own names until it moves to the API.
 */
export function renameFields(error: unknown, names: Record<string, string>): unknown {
  if (!isApiError(error)) return error;
  const errors = error.errors.map((e) => {
    const field = e.pointer?.replace(/^#\//, "").split("/")[0];
    return field && names[field] ? { ...e, pointer: `#/${names[field]}` } : e;
  });
  return new ApiError(error.status ?? 0, error.code, error.message, errors);
}

/** Lightning refused it, with this `code` if one is given (`isApiError(error, "step_up_required")`). */
export const isApiError = (error: unknown, code?: string): error is ApiError =>
  error instanceof ApiError && (code === undefined || error.code === code);

/**
 * The session has ended, or never began: any 401 but a refused sign-in
 * (`invalid_credentials`, `mfa_required`). Lightning answers
 * `unauthenticated`, `invalid_token`, or a bare 401 for a locked-out account.
 */
export const isSignedOut = (error: unknown) =>
  error instanceof ApiError && error.status === 401 && error.code !== "invalid_credentials" && error.code !== "mfa_required";

/** Whether asking again might help: not for a refusal (4xx), which won't change. */
export const canRetry = (error: unknown) => !(error instanceof ApiError && error.status !== undefined && error.status >= 400 && error.status < 500);

/**
 * A page's `status` from its query: loading while there's no data, Lightning's
 * not found and no access from the code, otherwise the server's message. A
 * failed reload keeps the rows already on screen.
 */
export function statusOf(query: { data: unknown; error: Error | null }): ResourceStatus {
  if (query.data !== undefined) return { state: "ready" };
  if (!query.error) return { state: "loading" };
  if (isApiError(query.error, "not_found")) return { state: "notFound" };
  if (isApiError(query.error, "forbidden")) return { state: "forbidden" };
  return { state: "error", message: query.error.message };
}

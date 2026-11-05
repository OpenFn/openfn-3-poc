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
import { fakeFetch } from "@/fake-api";

// For stories and tests only: drive the fake server.
export { failNext, resetFakeApi, FAKE_PASSWORD, FAKE_MFA_CODE } from "@/fake-api";

const send = import.meta.env["VITE_API"] === "lightning" ? fetch : fakeFetch;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await send(path, {
      method,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
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
  let next: string | null = `${path}?page_size=100`;
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


/** Lightning refused it, with this `code` if one is given (`isApiError(error, "step_up_required")`). */
export const isApiError = (error: unknown, code?: string): error is ApiError =>
  error instanceof ApiError && (code === undefined || error.code === code);

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

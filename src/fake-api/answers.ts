/** How the pretend server answers: problem documents, pages, ids. Shared by its resource files. */

export interface Problem {
  status: number;
  code: string;
  detail?: string;
  errors?: { code: string; detail: string; pointer?: string; parameter?: string; path?: string }[];
}

export type Body = Record<string, unknown>;
export type Handler = (params: Record<string, string>, body: Body, query: URLSearchParams) => Response;

export const now = (at = new Date()) => at.toISOString().replace(/\.\d+Z$/, "Z"); // utc_datetime: whole seconds, like Lightning
/** When the seeded records were made. */
export const SEEDED_AT = "2026-01-01T00:00:00Z";

const titles: Record<number, string> = { 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 422: "Unprocessable Content" };
export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
export const problem = ({ status, code, detail = "The server could not complete that request.", errors }: Problem) =>
  json(status, { type: "about:blank", status, title: titles[status] ?? "Error", code, detail, ...(errors ? { errors } : {}) });
export const noContent = () => new Response(null, { status: 204 });
/** The session must be stepped up first (api/authentication.md, session tokens). */
export const stepUpRequired = () =>
  problem({ status: 403, code: "step_up_required", detail: "Enter your password or an MFA code again to do this." });
export const forbidden = () => problem({ status: 403, code: "forbidden", detail: "You are not allowed to do that." });
// One 422 for every problem with a body (api/errors.md).
export const invalid = (errors: NonNullable<Problem["errors"]>) =>
  problem({ status: 422, code: "invalid", detail: "The request body is not valid.", errors });
export const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Links are absolute, like Lightning's; the client keeps only the path.
export const ORIGIN = "http://localhost:4000";
/**
 * One page of a list (api/conventions.md): `page` from 1, `page_size` 10 by
 * default and at most 100, and links that carry the query as sent.
 */
export function paged<T>(path: string, rows: T[], query: URLSearchParams, key = "data") {
  const size = Math.min(Math.max(Number(query.get("page_size")) || 10, 1), 100);
  const last = Math.max(Math.ceil(rows.length / size), 1);
  const page = Math.min(Math.max(Number(query.get("page")) || 1, 1), last);
  const link = (n: number) => {
    const q = new URLSearchParams(query);
    q.set("page", String(n));
    q.set("page_size", String(size));
    return `${ORIGIN}${path}?${q}`;
  };
  return {
    [key]: rows.slice((page - 1) * size, page * size),
    links: { self: link(page), first: link(1), last: link(last), next: page < last ? link(page + 1) : null, prev: page > 1 ? link(page - 1) : null },
  };
}

/** A 400 for an `include` the route doesn't know (api/conventions.md). */
export function badInclude(query: URLSearchParams, known: string[]) {
  const unknown = (query.get("include") ?? "").split(",").filter((v) => v && !known.includes(v));
  return unknown.length
    ? problem({ status: 400, code: "invalid_parameter", errors: unknown.map((v) => ({ code: "invalid", detail: `${v} is not a known include`, parameter: "include" })) })
    : undefined;
}

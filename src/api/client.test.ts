import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canRetry, isApiError, request, toApiError } from "./client";
import { FAKE_MFA_CODE, FAKE_PASSWORD, failNext, resetFakeApi } from "./testing";
import { stepUp } from "./session";
import type { ApiTokenEntry } from "./tokens";

describe("toApiError", () => {
  it("keeps a problem document's code and detail, and keys its body entries as field errors", () => {
    const error = toApiError(422, {
      status: 422,
      code: "invalid",
      detail: "The body is not valid.",
      errors: [
        { pointer: "#/name", code: "taken", detail: "has already been taken" },
        { pointer: "#/project_credentials/0/project_id", code: "no_access", detail: "is not a project you can use" },
        { parameter: "page", code: "type", detail: "is not a number" },
      ],
    });
    expect(error).toMatchObject({ status: 422, code: "invalid", message: "The body is not valid." });
    expect(error.fieldErrors).toEqual({ name: ["has already been taken"], "project_credentials.0.project_id": ["is not a project you can use"] });
  });

  it("names the code from the status when the body isn't a problem document", () => {
    expect(toApiError(403, undefined)).toMatchObject({ code: "forbidden", message: "Lightning answered 403." });
    expect(toApiError(502, "Bad Gateway")).toMatchObject({ code: "internal" });
  });
});

describe("canRetry", () => {
  it("retries a crash or an unreachable server, never a refusal", () => {
    expect(canRetry(toApiError(500, undefined))).toBe(true);
    expect(canRetry(toApiError(0, undefined))).toBe(true);
    expect(canRetry(toApiError(403, undefined))).toBe(false);
    expect(canRetry(toApiError(404, undefined))).toBe(false);
  });
});

describe("request, on the fake server", () => {
  const list = () => request<{ data: ApiTokenEntry[] }>("GET", "/api/me/tokens").then((r) => r.data);
  const generate = () => request<{ data: ApiTokenEntry }>("POST", "/api/me/tokens").then((r) => r.data);
  const refusal = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

  beforeEach(() => {
    resetFakeApi();
    // Only the clock is fake; the fake server's short wait still runs.
    vi.useFakeTimers({ toFake: ["Date"] });
  });
  afterEach(() => vi.useRealTimers());

  it("generates a token only in the five minutes after stepping up, and lists it masked", async () => {
    const before = await list();
    expect(isApiError(await refusal(generate()), "step_up_required")).toBe(true);

    const session = await stepUp({ password: FAKE_PASSWORD });
    expect(Date.parse(session.stepped_up_until!) - Date.now()).toBe(5 * 60_000);
    const created = await generate();
    expect(created.token).toMatch(/^demo\.fake-token-not-real\./);
    const after = await list();
    expect(after).toHaveLength(before.length + 1);
    expect(after[0]).toMatchObject({ id: created.id, token: "..." + created.token.slice(-10) });

    vi.advanceTimersByTime(5 * 60_000);
    expect(isApiError(await refusal(generate()), "step_up_required")).toBe(true);
    const { data } = await request<{ data: { stepped_up_until: string | null } }>("GET", "/api/session");
    expect(data.stepped_up_until).toBeNull();

    await stepUp({ mfaCode: FAKE_MFA_CODE });
    await expect(generate()).resolves.toMatchObject({ last_used_at: null });
  });

  it("refuses a wrong password with invalid_credentials, and stays not stepped up", async () => {
    expect(await refusal(stepUp({ password: "wrong" }))).toMatchObject({ status: 401, code: "invalid_credentials" });
    expect(isApiError(await refusal(generate()), "step_up_required")).toBe(true);
  });

  it("deletes a token, answers 404 for one already gone, and fails a route once on failNext", async () => {
    const [first] = await list();
    await expect(request("DELETE", `/api/me/tokens/${first!.id}`)).resolves.toBeUndefined();
    expect(await refusal(request("DELETE", `/api/me/tokens/${first!.id}`))).toMatchObject({ status: 404, code: "not_found" });

    failNext("GET /api/me/tokens", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    expect(await refusal(list())).toMatchObject({ status: 500, code: "internal", message: "Something went wrong in Lightning." });
    expect((await list()).map((t) => t.id)).not.toContain(first!.id);
  });

  it("sends the session's CSRF token on writes, and a new session's after signing in again", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    await expect(generate()).resolves.toBeTruthy();
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: "demo@openfn.org", password: FAKE_PASSWORD });
    await expect(stepUp({ password: FAKE_PASSWORD })).resolves.toMatchObject({ state: "signed_in" });
  });

  it("refuses a write with a token from before the session changed elsewhere, and asks again for the next", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    await generate();
    // Another tab signed in again: the stored session has a new token the client hasn't seen.
    localStorage.setItem("fake-api:session", JSON.stringify({ userId: "user-amy", mfaPendingId: null, csrf: "from-another-tab" }));
    expect(await refusal(generate())).toMatchObject({ status: 403, code: "forbidden" });
    await expect(generate()).resolves.toBeTruthy();
  });

  it("signs in as someone else when already signed in", async () => {
    await request("POST", "/api/session", { email: "viewer@openfn.org", password: FAKE_PASSWORD });
    await expect(request("GET", "/api/me")).resolves.toMatchObject({ data: { id: "user-vikram" } });
  });

  it("answers 401 unauthenticated to every route but signing in once signed out", async () => {
    await request("DELETE", "/api/session");
    expect(await refusal(list())).toMatchObject({ status: 401, code: "unauthenticated" });
    expect(await refusal(request("GET", "/api/me"))).toMatchObject({ status: 401, code: "unauthenticated" });
    await expect(request("GET", "/api/instance")).resolves.toBeTruthy();
  });
});

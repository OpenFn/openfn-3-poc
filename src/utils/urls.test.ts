import { describe, expect, it } from "vitest";
import { returnTo, signInRedirect } from "./urls";

const at = (value: string) => returnTo(new URLSearchParams({ return_to: value }));

describe("returnTo", () => {
  it("keeps a path in this app, with its query and hash", () => {
    expect(at("/projects/abc/settings?x=1#webhooks")).toBe("/projects/abc/settings?x=1#webhooks");
  });

  it("ignores anything that could leave the site, and a missing one", () => {
    for (const away of ["https://evil.example", "//evil.example", "/\\evil.example", "evil", ""]) expect(at(away)).toBe("/projects");
    expect(returnTo(new URLSearchParams(), "/profile")).toBe("/profile");
  });
});

describe("signInRedirect", () => {
  it("sends signed-out and MFA sessions to sign in, keeping path, query and hash; other states stay", () => {
    const here = "/projects/abc?x=1#webhooks";
    expect(signInRedirect("signed_out", here)).toBe(`/users/log_in?return_to=${encodeURIComponent(here)}`);
    expect(signInRedirect("mfa_required", here)).toBe(`/users/two-factor?return_to=${encodeURIComponent(here)}`);
    for (const state of ["signed_in", "confirmation_required", undefined] as const) expect(signInRedirect(state, here)).toBeUndefined();
  });
});

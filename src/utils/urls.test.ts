import { describe, expect, it } from "vitest";
import { returnTo } from "./urls";

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

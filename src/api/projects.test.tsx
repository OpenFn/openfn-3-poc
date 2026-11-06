import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { projects } from "@/mock-data/projects";
import ApiProvider from "./ApiProvider";
import { request } from "./client";
import { isAdminProjectSortKey, useRefusedForMfa } from "./projects";
import { resetFakeApi } from "./testing";

// One more project that requires MFA, with Sizwe its only member: the signed-in superuser, Amy, isn't one.
vi.mock("@/mock-data/projects", async (original) => {
  const { projects } = await original<typeof import("@/mock-data/projects")>();
  const dhis2 = projects.find((p) => p.name === "dhis2-project")!;
  const notMine = { ...dhis2, id: "6e1f2a3b-4c5d-4e6f-8a7b-9c0d1e2f3a4b", name: "not-mine", members: dhis2.members.filter((m) => m.userId === "user-sizwe") };
  return { projects: [...projects, notMine] };
});

const wrapper = ({ children }: { children: ReactNode }) => <ApiProvider retry={false}>{children}</ApiProvider>;
const idOf = (name: string) => projects.find((p) => p.name === name)!.id;

describe("useRefusedForMfa", () => {
  beforeEach(resetFakeApi);

  it.each([
    ["a member, sent to set up MFA", idOf("dhis2-project"), true],
    ["a superuser who isn't a member, told No Access", idOf("not-mine"), false],
  ])("on a refused project that requires MFA: %s", async (_, id, expected) => {
    const { result } = renderHook(() => useRefusedForMfa(id, true), { wrapper });
    await waitFor(() => expect(result.current).toBe(expected), { timeout: 3000 });
  });
});

describe("GET /api/projects, on the fake server", () => {
  beforeEach(resetFakeApi);

  it("refuses an unknown sort with 400, an inherited name like constructor too", async () => {
    for (const sort of ["owner", "constructor", "-toString"]) {
      const refusal = await request("GET", `/api/projects?scope=all&sort=${sort}`).then(() => null, (error: unknown) => error);
      expect(refusal).toMatchObject({ status: 400, code: "invalid_parameter" });
    }
  });
});

describe("isAdminProjectSortKey", () => {
  it("takes the admin list's sort fields and nothing else, not even an inherited name like constructor", () => {
    expect(["name", "inserted_at"].every(isAdminProjectSortKey)).toBe(true);
    for (const key of ["owner", "constructor", "toString", undefined]) expect(isAdminProjectSortKey(key)).toBe(false);
  });
});

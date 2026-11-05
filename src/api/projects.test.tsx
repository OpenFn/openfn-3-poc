import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import ApiProvider from "./ApiProvider";
import { listAll } from "./client";
import { useRefusedForMfa, type ApiProject } from "./projects";

vi.mock("./client", async (original) => ({ ...(await original<typeof import("./client")>()), listAll: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => <ApiProvider retry={false}>{children}</ApiProvider>;
const listed = (member: boolean): ApiProject => ({
  id: "p1",
  attributes: { name: "dhis2", description: null, requires_mfa: true, ...(member && { role: "admin" as const }) },
});

describe("useRefusedForMfa", () => {
  it.each([
    ["a member, sent to set up MFA", listed(true), true],
    // A superuser's list holds every project, theirs or not.
    ["a superuser listed but not a member, told No Access", listed(false), false],
  ])("on a refused project that requires MFA: %s", async (_, project, expected) => {
    vi.mocked(listAll).mockResolvedValue([project]);
    const { result } = renderHook(() => useRefusedForMfa("p1", true), { wrapper });
    await waitFor(() => expect(result.current).toBe(expected));
    // Sandboxes too, each with your role.
    expect(listAll).toHaveBeenCalledWith("/api/projects?depth=all&include=stats", "data");
  });
});

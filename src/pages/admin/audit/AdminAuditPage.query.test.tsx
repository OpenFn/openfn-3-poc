import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { failNext, resetFakeApi } from "@/api/testing";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AdminAuditPageQuery from "./AdminAuditPage.query";

const wait = { timeout: 3000 };

function renderAt(search: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[`/settings/audit${search}`]}>
        <ReactRouterAdapter>
          <Routes>
            <Route path="/settings/audit" element={<AdminAuditPageQuery />} />
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

const summary = async () =>
  (await screen.findByText((_, el) => el?.tagName === "P" && /^Page \d/.test(el.textContent ?? ""), {}, wait)).textContent;

describe("AdminAuditPageQuery", () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer; Testing Library moves the fake clock on while it waits.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the page in the URL, and links to the others", async () => {
    renderAt("?page=2");
    expect(await summary()).toBe("Page 2 of 2");
    expect(screen.getByRole("link", { name: "1" }).getAttribute("href")).toBe("/settings/audit");
  });

  it("shows the last page for an overflow page, as the server answers it", async () => {
    renderAt("?page=9");
    expect(await summary()).toBe("Page 2 of 2");
  });

  it("shows the actor as the API sends it, with the actor's short id under it", async () => {
    renderAt("?page=2");
    const actor = (await screen.findAllByText("Amy Admin (demo@openfn.org)", {}, wait))[0]!;
    expect(actor.nextElementSibling?.textContent).toBe("user-amy");
  });

  it("shows No Access when the server refuses", async () => {
    failNext("GET /api/audit_events", { status: 403, code: "forbidden" });
    renderAt("");
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
  });
});

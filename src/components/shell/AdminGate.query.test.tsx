import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, resetFakeApi } from "@/api/testing";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AdminGate from "./AdminGate.query";
import SessionGate from "./SessionGate.query";

const wait = { timeout: 3000 };

function renderAdminPage() {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={["/settings/users"]}>
        <ReactRouterAdapter>
          <Routes>
            <Route element={<SessionGate />}>
              <Route element={<AdminGate />}>
                <Route path="/settings/users" element={<p>Admin page</p>} />
              </Route>
            </Route>
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

describe("AdminGate", () => {
  beforeEach(() => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows an admin page to a superuser", async () => {
    renderAdminPage();
    expect(await screen.findByText("Admin page", {}, wait)).toBeTruthy();
  });

  it("shows anyone else Lightning's No Access instead, announced", async () => {
    await request("POST", "/api/session", { email: "viewer@openfn.org", password: FAKE_PASSWORD });
    renderAdminPage();
    const heading = await screen.findByRole("heading", { level: 1, name: "No Access" }, wait);
    expect(heading.closest("[role=status]")).toBeTruthy();
    expect(screen.getByText("Sorry, you don't have access to that.")).toBeTruthy();
    expect(screen.queryByText("Admin page")).toBeNull();
  });
});

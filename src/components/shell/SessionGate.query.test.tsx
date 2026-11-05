import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { useTokenSaves } from "@/api/tokens";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { useCurrentUser } from "@/session/session";
import Button from "@/components/primitives/Button";
import LogOut from "./LogOut.query";
import SessionGate from "./SessionGate.query";

const wait = { timeout: 3000 };

function Where() {
  const { pathname, search } = useLocation();
  return <p>At {pathname + search}</p>;
}

function Private() {
  const user = useCurrentUser();
  const { remove } = useTokenSaves();
  return (
    <>
      <p>Signed in as {user.email}</p>
      <Button onClick={() => void remove("any").catch(() => undefined)}>Delete a token</Button>
    </>
  );
}

function renderAt(path: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <Routes>
            <Route path="/users/log_out" element={<LogOut />} />
            <Route element={<SessionGate />}>
              <Route path="/projects/:id" element={<Private />} />
            </Route>
            <Route path="*" element={<Where />} />
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

describe("SessionGate", () => {
  beforeEach(() => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows the page to the signed-in user, from the API", async () => {
    renderAt("/projects/abc");
    expect(await screen.findByText("Signed in as demo@openfn.org", {}, wait)).toBeTruthy();
  });

  it("sends a deep link to log in when signed out, keeping where it was going", async () => {
    await request("DELETE", "/api/session");
    renderAt("/projects/abc?tab=1");
    expect(await screen.findByText(`At /users/log_in?return_to=${encodeURIComponent("/projects/abc?tab=1")}`, {}, wait)).toBeTruthy();
  });

  it("sends a session still owing an MFA code to the two-factor page", async () => {
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: "super@openfn.org", password: FAKE_PASSWORD }).catch(() => undefined);
    renderAt("/projects/abc");
    expect(await screen.findByText(`At /users/two-factor?return_to=${encodeURIComponent("/projects/abc")}`, {}, wait)).toBeTruthy();
  });

  it("logs out to the log in page, and the next deep link asks to log in", async () => {
    renderAt("/users/log_out");
    expect(await screen.findByText("At /users/log_in", {}, wait)).toBeTruthy();
    await expect(request("GET", "/api/session")).rejects.toMatchObject({ status: 401 });
  });

  it("says so, and stays, when signing out fails", async () => {
    failNext("DELETE /api/session", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt("/users/log_out");
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.queryByText(/At \/users\/log_in/)).toBeNull();
  });

  it("sends the person to log in when a save finds the session gone", async () => {
    renderAt("/projects/abc");
    const button = await screen.findByRole("button", { name: "Delete a token" }, wait);
    // Signed out in another tab: this page's next save answers 401, so the gate checks the session again.
    await request("DELETE", "/api/session");
    fireEvent.click(button);
    expect(await screen.findByText(`At /users/log_in?return_to=${encodeURIComponent("/projects/abc")}`, {}, wait)).toBeTruthy();
  });
});

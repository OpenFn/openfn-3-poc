import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type InitialEntry } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { useTokenSaves } from "@/api/tokens";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { useCurrentUser } from "@/session/session";
import Button from "@/components/primitives/Button";
import { ToastProvider } from "@/components/primitives/Toast";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import type { Flash } from "@/types/auth";
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
  const navigate = useNavigate();
  const flash: Flash = { tone: "info", message: "Moved on." };
  return (
    <main tabIndex={-1}>
      <p>Signed in as {user.email}</p>
      <Button onClick={() => void remove("any").catch(() => undefined)}>Delete a token</Button>
      <Button onClick={() => void navigate("/projects/next", { state: { flash } })}>Move on</Button>
    </main>
  );
}

// `logIn` puts the real login page at /users/log_in; `strict` renders twice, as main.tsx's StrictMode does.
function renderAt(path: InitialEntry, { logIn = false, strict = false } = {}) {
  const toast = vi.fn();
  const app = (
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <ToastProvider show={toast}>
            <Routes>
              <Route path="/users/log_out" element={<LogOut />} />
              {logIn && <Route path="/users/log_in" element={<AuthLoginPageQuery />} />}
              <Route element={<SessionGate />}>
                <Route path="/projects/:id" element={<Private />} />
              </Route>
              <Route path="*" element={<Where />} />
            </Routes>
          </ToastProvider>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
  render(strict ? <StrictMode>{app}</StrictMode> : app);
  return toast;
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

  it("toasts each message a redirect carries into the app, once", async () => {
    const flash: Flash = { tone: "info", message: "User confirmed successfully." };
    const toast = renderAt({ pathname: "/projects/abc", state: { flash } }, { strict: true });
    await screen.findByText("Signed in as demo@openfn.org", {}, wait);
    expect(toast.mock.calls).toEqual([["User confirmed successfully.", "info"]]);
    // The gate stays mounted, and takes the next one as it arrives.
    fireEvent.click(screen.getByRole("button", { name: "Move on" }));
    await waitFor(() => expect(toast.mock.calls).toEqual([["User confirmed successfully.", "info"], ["Moved on.", "info"]]));
  });

  it("leaves focus alone on opening the app, or reloading a page it had visited", async () => {
    // A reload keeps the entry's key, so this is a visited entry opened again.
    renderAt({ pathname: "/projects/abc", key: "visited" });
    await screen.findByText("Signed in as demo@openfn.org", {}, wait);
    expect(document.activeElement).toBe(document.body);
  });

  it("drops a carried message when it sends the person to log in", async () => {
    await request("DELETE", "/api/session");
    const flash: Flash = { tone: "info", message: "User confirmed successfully." };
    const toast = renderAt({ pathname: "/projects/abc", state: { flash } });
    expect(await screen.findByText(/At \/users\/log_in/, {}, wait)).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  it("gives focus to the page after signing in", async () => {
    await request("DELETE", "/api/session");
    renderAt(`/users/log_in?return_to=${encodeURIComponent("/projects/abc")}`, { logIn: true });
    fireEvent.change(await screen.findByRole("textbox", { name: /^Email/ }, wait), { target: { value: "demo@openfn.org" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: FAKE_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await screen.findByText("Signed in as demo@openfn.org", {}, wait);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("main")));
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

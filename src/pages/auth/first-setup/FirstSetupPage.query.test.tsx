import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi, setNeedsSetup } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import LogOut from "@/components/shell/LogOut.query";
import SessionGate from "@/components/shell/SessionGate.query";
import AuthRegisterPage from "@/pages/auth/AuthRegisterPage";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import AuthResetPasswordPageQuery from "@/pages/auth/reset-password/AuthResetPasswordPage.query";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import FirstSetupPageQuery from "./FirstSetupPage.query";

const wait = { timeout: 3000 };
const NEW_PASSWORD = "a-superuser-password";

function Where() {
  const { pathname, search } = useLocation();
  return <p>At {pathname + search}</p>;
}

function renderAt(path: string) {
  const toast = vi.fn();
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <ToastProvider show={toast}>
            <Where />
            <Routes>
              <Route path="/first_setup" element={<FirstSetupPageQuery />} />
              <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
              <Route path="/users/log_out" element={<LogOut />} />
              <Route path="/users/register" element={<AuthRegisterPage />} />
              <Route path="/users/reset_password" element={<AuthResetPasswordPageQuery />} />
              <Route element={<SessionGate />}>
                <Route path="/projects" element={<Link to="/users/log_out">Log out</Link>} />
              </Route>
            </Routes>
          </ToastProvider>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
  return toast;
}

const at = (path: string) => screen.findByText(`At ${path}`, {}, wait);
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
async function setUp(email: string, password = NEW_PASSWORD) {
  await screen.findByRole("heading", { name: "Setup" }, wait);
  fill(/^First name/, "Ada");
  fill(/^Last name/, "Admin");
  fill(/^Email/, email);
  fill(/^Password$/, password);
  fill(/^Password confirmation/, password);
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
}
const instance = () => request<{ data: { needs_setup: boolean } }>("GET", "/api/instance").then((answer) => answer.data);
const me = () => request<{ data: { attributes: { email: string; role: string } } }>("GET", "/api/me").then((answer) => answer.data.attributes);

describe("FirstSetupPageQuery", () => {
  beforeEach(() => {
    resetFakeApi();
    setNeedsSetup();
  });

  it("sends a signed-out visit to a signed-in page on to first setup", async () => {
    renderAt("/projects");
    expect(await at("/first_setup")).toBeTruthy();
  });

  it("sends log in to first setup", async () => {
    renderAt("/users/log_in");
    expect(await at("/first_setup")).toBeTruthy();
  });

  it("sends someone signed in to first setup from a signed-in page", async () => {
    await request("POST", "/api/session", { email: "demo@openfn.org", password: FAKE_PASSWORD });
    renderAt("/projects");
    expect(await at("/first_setup")).toBeTruthy();
  });

  it("shows the release label from the instance", async () => {
    renderAt("/first_setup");
    expect(await screen.findByText("v2.19.1", {}, wait)).toBeTruthy();
  });

  it("creates the superuser, signs them in in place of whoever was, on the projects list with the message once, and closes setup", async () => {
    await request("POST", "/api/session", { email: "demo@openfn.org", password: FAKE_PASSWORD });
    const toast = renderAt("/first_setup");
    await setUp("ada@example.com");
    expect(await screen.findByRole("link", { name: "Log out" }, wait)).toBeTruthy();
    expect(screen.getByText("At /projects")).toBeTruthy();
    expect(toast.mock.calls).toEqual([["Superuser account created.", "info"]]);
    await expect(me()).resolves.toMatchObject({ email: "ada@example.com", role: "superuser" });
    await expect(instance()).resolves.toMatchObject({ needs_setup: false });
    // The client drops the old session's CSRF token, so the first write after setup goes through.
    fireEvent.click(screen.getByRole("link", { name: "Log out" }));
    expect(await screen.findByText("Logged out successfully.", {}, wait)).toBeTruthy();
    // Setup is done: opening it again goes on to the projects list (and from there, signed out, to log in).
    cleanup();
    renderAt("/first_setup");
    expect(await at("/users/log_in?return_to=%2Fprojects")).toBeTruthy();
  });

  it.each([
    ["DEMO@openfn.org", "has already been taken"],
    ["not-an-email", "must be a valid email address"],
  ])("shows the server's word on %s under Email", async (email, words) => {
    renderAt("/first_setup");
    await setUp(email);
    expect(await screen.findByText(words, {}, wait)).toBeTruthy();
    expect(screen.getByLabelText(/^Email/).getAttribute("aria-invalid")).toBe("true");
  });

  it("shows the server's word on a short password under Password", async () => {
    renderAt("/first_setup");
    await setUp("ada@example.com", "elevenchars");
    expect(await screen.findByText("should be at least 12 character(s)", {}, wait)).toBeTruthy();
    expect(screen.getByLabelText(/^Password$/).getAttribute("aria-invalid")).toBe("true");
  });

  it("shows a failure it doesn't expect by the form", async () => {
    failNext("POST /api/users", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt("/first_setup");
    await setUp("ada@example.com");
    expect((await screen.findByRole("alert", {}, wait)).textContent).toContain("Something went wrong in Lightning.");
  });

  // Register has no .query yet: its case holds the line for when it gets one.
  it.each(["/users/reset_password", "/users/register"])("leaves %s where it is", async (path) => {
    renderAt(path);
    // Asked after the page's own request, so answered after it; then the page's answer reaches it.
    await act(() => instance());
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    expect(screen.getByText(`At ${path}`)).toBeTruthy();
  });
});

describe("FirstSetupPageQuery, once set up", () => {
  beforeEach(() => resetFakeApi());

  it("sends /first_setup to the projects list", async () => {
    renderAt("/first_setup");
    expect(await screen.findByRole("link", { name: "Log out" }, wait)).toBeTruthy();
    expect(screen.getByText("At /projects")).toBeTruthy();
  });

  it("refuses a create from a stale first-setup form", async () => {
    const values = { first_name: "Ada", last_name: "Admin", email: "ada@example.com", password: NEW_PASSWORD };
    await expect(request("POST", "/api/users", values)).rejects.toMatchObject({ status: 403 });
    await request("DELETE", "/api/session");
    await expect(request("POST", "/api/users", values)).rejects.toMatchObject({ status: 401 });
  });

  it("leaves log in where it is", async () => {
    await request("DELETE", "/api/session");
    renderAt("/users/log_in");
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    expect(screen.getByText("At /users/log_in")).toBeTruthy();
  });
});

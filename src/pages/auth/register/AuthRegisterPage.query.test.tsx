import { act, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { failNext, resetFakeApi, setAllowSignup, setNeedsSetup } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import LogOut from "@/components/shell/LogOut.query";
import SessionGate from "@/components/shell/SessionGate.query";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AuthRegisterPageQuery from "./AuthRegisterPage.query";

const wait = { timeout: 3000 };
const PASSWORD = "a-new-user-password";

function Where() {
  const { pathname } = useLocation();
  return <p>At {pathname}</p>;
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
              <Route path="/users/register" element={<AuthRegisterPageQuery />} />
              <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
              <Route path="/users/log_out" element={<LogOut />} />
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

const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
async function register(email: string, password = PASSWORD) {
  await screen.findByRole("heading", { name: "Register" }, wait);
  fill(/^First Name/, "Ada");
  fill(/^Last Name/, "Lovelace");
  fill(/^Email/, email);
  fill(/^Password/, password);
  fireEvent.click(screen.getByRole("checkbox", { name: /I accept the terms of service/ }));
  fireEvent.click(screen.getByRole("button", { name: "Register" }));
}
const me = () => request<{ data: { attributes: { email: string; role: string; confirmed_at: string | null } } }>("GET", "/api/me").then((answer) => answer.data.attributes);

describe("AuthRegisterPageQuery", () => {
  beforeEach(async () => {
    resetFakeApi();
    await request("DELETE", "/api/session");
    setAllowSignup();
  });

  it("registers, signs the new user in on the projects list with the message once, and Log out works", async () => {
    const toast = renderAt("/users/register");
    await register("Ada@Example.com");
    expect(await screen.findByRole("link", { name: "Log out" }, wait)).toBeTruthy();
    expect(screen.getByText("At /projects")).toBeTruthy();
    expect(toast.mock.calls).toEqual([["User created successfully.", "info"]]);
    await expect(me()).resolves.toMatchObject({ email: "ada@example.com", role: "user" });
    fireEvent.click(screen.getByRole("link", { name: "Log out" }));
    expect(await screen.findByText("Logged out successfully.", {}, wait)).toBeTruthy();
  });

  it.each([
    ["editor@openfn.org", PASSWORD, /^Email/, "has already been taken"],
    ["not-an-email", PASSWORD, /^Email/, "must be a valid email address"],
    ["ada@example.com", "elevenchars", /^Password/, "should be at least 12 character(s)"],
  ])("shows the server's words on %s / %s under the field", async (email, password, label, words) => {
    renderAt("/users/register");
    await register(email, password);
    expect(await screen.findByText(words, {}, wait)).toBeTruthy();
    expect(screen.getByLabelText(label).getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(screen.getByLabelText(label));
  });

  it("shows a failure it doesn't expect by the form", async () => {
    failNext("POST /api/users", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt("/users/register");
    await register("ada@example.com");
    expect((await screen.findByRole("alert", {}, wait)).textContent).toContain("Something went wrong in Lightning.");
  });

  it("answers in plain text, with no form, when sign-up is off", async () => {
    setAllowSignup(false);
    renderAt("/users/register");
    expect(await screen.findByText("Self-signup has been disabled for this instance. Please contact the administrator.", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Register" })).toBeNull();
  });

  it("sends someone signed in to the projects list", async () => {
    // Which also turns sign-up off: being signed in is checked first.
    resetFakeApi();
    renderAt("/users/register");
    expect(await screen.findByRole("link", { name: "Log out" }, wait)).toBeTruthy();
    expect(screen.getByText("At /projects")).toBeTruthy();
  });

  it("stays put on a fresh install, and registering there makes the superuser", async () => {
    setNeedsSetup();
    renderAt("/users/register");
    await screen.findByRole("heading", { name: "Register" }, wait);
    // Asked after the page's own request, so answered after it; then the page's answer reaches it.
    await act(() => request("GET", "/api/instance"));
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    expect(screen.getByText("At /users/register")).toBeTruthy();
    await register("ada@example.com");
    expect(await screen.findByRole("link", { name: "Log out" }, wait)).toBeTruthy();
    await expect(me()).resolves.toMatchObject({ role: "superuser" });
  });

  it("makes an unconfirmed user whatever role or confirmation is sent, and refuses a create without the terms", async () => {
    const body = { first_name: "Ada", last_name: "Lovelace", email: "ada@example.com", password: PASSWORD };
    await expect(request("POST", "/api/users", body)).rejects.toMatchObject({
      status: 422,
      fieldErrors: { terms_accepted: ["Please accept the terms and conditions to register."] },
    });
    await request("POST", "/api/users", { ...body, terms_accepted: true, role: "superuser", confirmed: true });
    await expect(me()).resolves.toMatchObject({ role: "user", confirmed_at: null });
  });
});

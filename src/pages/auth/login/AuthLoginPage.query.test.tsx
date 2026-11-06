import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type InitialEntry } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_MFA_CODE, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import Button from "@/components/primitives/Button";
import AuthTwoFactorPageQuery from "@/pages/auth/two-factor/AuthTwoFactorPage.query";
import AuthLoginPageQuery from "./AuthLoginPage.query";

const wait = { timeout: 3000 };

function Where() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <p>At {pathname + search}</p>
      <Button onClick={() => void navigate(-1)}>Back</Button>
    </>
  );
}

function renderAt(path: InitialEntry) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <Routes>
            <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
            <Route path="/users/two-factor" element={<AuthTwoFactorPageQuery />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

const logIn = (email: string, password: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
};
const session = () => request<{ data: { state: string; user_id: string } }>("GET", "/api/session").then((r) => r.data);

describe("AuthLoginPageQuery", () => {
  beforeEach(async () => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
    // Start signed out.
    await request("DELETE", "/api/session");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("sends someone already signed in on to return_to", async () => {
    await request("POST", "/api/session", { email: "demo@openfn.org", password: FAKE_PASSWORD });
    renderAt("/users/log_in?return_to=%2Fcredentials");
    expect(await screen.findByText("At /credentials", {}, wait)).toBeTruthy();
  });

  it("shows why Register or a provider may be missing when the instance doesn't load", async () => {
    failNext("GET /api/instance", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt("/users/log_in");
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log in" })).toBeTruthy();
  });

  it("shows a carried message once, and not again after Back", async () => {
    renderAt({ pathname: "/users/log_in", state: { flash: { tone: "info", message: "Password reset successfully." } } });
    expect((await screen.findByRole("status", {}, wait)).textContent).toContain("Password reset successfully.");
    fireEvent.click(screen.getByRole("link", { name: "Forgot your password?" }));
    fireEvent.click(await screen.findByRole("button", { name: "Back" }, wait));
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    expect(screen.queryByText("Password reset successfully.")).toBeNull();
  });

  it("refuses a wrong password in Lightning's words and stays signed out", async () => {
    renderAt("/users/log_in");
    logIn("demo@openfn.org", "wrong");
    expect(await screen.findByText("Invalid email or password", {}, wait)).toBeTruthy();
    await expect(session()).rejects.toMatchObject({ status: 401 });
  });

  it("signs in and goes to return_to", async () => {
    renderAt(`/users/log_in?return_to=${encodeURIComponent("/projects/abc/w?q=1")}`);
    logIn("viewer@openfn.org", FAKE_PASSWORD);
    expect(await screen.findByText("At /projects/abc/w?q=1", {}, wait)).toBeTruthy();
    expect(await session()).toMatchObject({ state: "signed_in", user_id: "user-vikram" });
  });

  it("goes to the projects list without return_to, and ignores one that leaves the app", async () => {
    renderAt("/users/log_in?return_to=//evil.example");
    logIn("demo@openfn.org", FAKE_PASSWORD);
    expect(await screen.findByText("At /projects", {}, wait)).toBeTruthy();
  });

  it("with MFA, asks for the code on the two-factor page, then goes to return_to", async () => {
    renderAt("/users/log_in?return_to=%2Fcredentials");
    logIn("super@openfn.org", FAKE_PASSWORD);
    const code = await screen.findByRole("textbox", { name: /Authentication Code/ }, wait);
    expect(await session()).toMatchObject({ state: "mfa_required" });
    fireEvent.change(code, { target: { value: FAKE_MFA_CODE } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    expect(await screen.findByText("At /credentials", {}, wait)).toBeTruthy();
    expect(await session()).toMatchObject({ state: "signed_in", user_id: "user-sizwe" });
  });
});

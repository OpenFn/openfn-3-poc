import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_CONFIRM_TOKEN, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import LogOut from "@/components/shell/LogOut.query";
import SessionGate from "@/components/shell/SessionGate.query";
import { authMessages } from "@/constants";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AuthConfirmationRequiredPageQuery from "./AuthConfirmationRequiredPage.query";

const wait = { timeout: 3000 };
const here = "/users/confirm-required";

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
              <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
              <Route path="/users/log_out" element={<LogOut />} />
              <Route path={here} element={<AuthConfirmationRequiredPageQuery />} />
              <Route element={<SessionGate />}>
                <Route path="/projects" element={<p>Projects</p>} />
              </Route>
            </Routes>
          </ToastProvider>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
  return toast;
}

const signIn = (email: string) => request("POST", "/api/session", { email, password: FAKE_PASSWORD });
const session = () => request<{ data: { state: string } }>("GET", "/api/session").then((answer) => answer.data.state);
const heading = () => screen.findByRole("heading", { level: 1, name: "Confirm your email address" }, wait);
const resend = async () => fireEvent.click(await screen.findByRole("button", { name: "Resend confirmation email" }, wait));
const sent = "We have sent a new confirmation link to your email address.";

describe("AuthConfirmationRequiredPageQuery", () => {
  beforeEach(async () => {
    resetFakeApi();
    await request("DELETE", "/api/session");
  });

  it("sends a signed-out visit to log in, coming back here", async () => {
    renderAt(here);
    expect(await screen.findByText(`At /users/log_in?return_to=${encodeURIComponent(here)}`, {}, wait)).toBeTruthy();
  });

  it("sends a session still owing an MFA code to two-factor, coming back here", async () => {
    await expect(signIn("super@openfn.org")).rejects.toMatchObject({ code: "mfa_required" });
    renderAt(here);
    expect(await screen.findByText(`At /users/two-factor?return_to=${encodeURIComponent(here)}`, {}, wait)).toBeTruthy();
  });

  it("sends a session that isn't locked out on to the projects list, with no message", async () => {
    await signIn("demo@openfn.org");
    const toast = renderAt(here);
    expect(await screen.findByText("Projects", {}, wait)).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  it("shows Una the page, without her address", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt(here);
    await heading();
    expect(screen.queryByText(/unconfirmed@openfn\.org/)).toBeNull();
  });

  it("sends Una from any signed-in page here, through SessionGate", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt("/projects");
    await heading();
    expect(screen.getByText(`At ${here}`)).toBeTruthy();
  });

  it("sends three new links, then shows the throttle message in place of the sent one", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt(here);
    for (let i = 0; i < 3; i++) {
      await resend();
      expect(await screen.findByText(sent, {}, wait)).toBeTruthy();
    }
    await resend();
    expect(await screen.findByText(authMessages.resendThrottled, {}, wait)).toBeTruthy();
    expect(screen.queryByText(sent)).toBeNull();
  });

  it("says when Lightning couldn't send it, and shows any other failure in the server's words", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt(here);
    failNext("POST /api/confirmations", { status: 503, code: "service_unavailable", detail: "Try again shortly." });
    await resend();
    expect(await screen.findByText(authMessages.resendFailed, {}, wait)).toBeTruthy();
    failNext("POST /api/confirmations", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    await resend();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.queryByText(authMessages.resendFailed)).toBeNull();
  });

  it("spends the same allowance when Una's address is given, still answering 202", async () => {
    await signIn("unconfirmed@openfn.org");
    // Four by email: one more than the allowance, still accepted.
    for (let i = 0; i < 4; i++) await request("POST", "/api/confirmations", { email: "unconfirmed@openfn.org" });
    await expect(request("POST", "/api/confirmations")).rejects.toMatchObject({ status: 429, code: "too_many_requests" });
  });

  it("logs Una out to the login page", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt(here);
    fireEvent.click(await screen.findByRole("link", { name: "Log out" }, wait));
    expect(await screen.findByText(authMessages.loggedOut, {}, wait)).toBeTruthy();
    expect(screen.getByText("At /users/log_in")).toBeTruthy();
    await expect(session()).rejects.toMatchObject({ status: 401 });
  });

  it("refuses Una everything but confirming, which then signs her in and sends her on from here", async () => {
    await signIn("unconfirmed@openfn.org");
    await expect(request("GET", "/api/me")).rejects.toMatchObject({ status: 401, code: "unauthenticated" });
    await expect(request("GET", "/api/projects")).rejects.toMatchObject({ status: 401, code: "unauthenticated" });
    await expect(request("PUT", `/api/confirmations/${FAKE_CONFIRM_TOKEN}`)).resolves.toMatchObject({ data: { confirmed: "account" } });
    expect(await session()).toBe("signed_in");
    renderAt(here);
    expect(await screen.findByText("Projects", {}, wait)).toBeTruthy();
  });

  it("signs Vikram in as usual", async () => {
    await signIn("viewer@openfn.org");
    expect(await session()).toBe("signed_in");
  });
});

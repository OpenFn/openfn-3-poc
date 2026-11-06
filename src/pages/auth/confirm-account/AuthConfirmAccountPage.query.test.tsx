import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_CONFIRM_TOKEN, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import SessionGate from "@/components/shell/SessionGate.query";
import { authMessages } from "@/constants";
import { authConfig } from "@/mock-data/auth";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AuthConfirmAccountPageQuery from "./AuthConfirmAccountPage.query";

const wait = { timeout: 3000 };
const { allowSignup } = authConfig;
const link = `/users/confirm/${FAKE_CONFIRM_TOKEN}`;

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
            <Routes>
              <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
              <Route path="/users/confirm" element={<AuthConfirmAccountPageQuery />} />
              <Route path="/users/confirm/:token" element={<AuthConfirmAccountPageQuery />} />
              <Route element={<SessionGate />}>
                <Route path="/projects" element={<Where />} />
              </Route>
              <Route path="*" element={<Where />} />
            </Routes>
          </ToastProvider>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
  return toast;
}

// Past the fake server's answers to the session and the instance.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 400)));
const signIn = (email: string) => request("POST", "/api/session", { email, password: FAKE_PASSWORD });
const resendTo = async (email: string) => {
  fireEvent.change(await screen.findByRole("textbox", { name: /^Email/ }, wait), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Resend confirmation instructions" }));
};
const confirm = async () => fireEvent.click(await screen.findByRole("button", { name: "Confirm my account" }, wait));

describe("AuthConfirmAccountPageQuery", () => {
  beforeEach(async () => {
    resetFakeApi();
    await request("DELETE", "/api/session");
  });
  afterEach(() => {
    authConfig.allowSignup = allowSignup;
  });

  it.each(["unconfirmed@openfn.org", "nobody@example.com"])("resending for %s signed out goes to log in with the same message", async (email) => {
    renderAt("/users/confirm");
    await resendTo(email);
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(authMessages.confirmSent);
  });

  // Una is locked out, so a signed-in resend uses Amy.
  it("resending signed in goes to the projects list and toasts the message", async () => {
    await signIn("demo@openfn.org");
    const toast = renderAt("/users/confirm");
    // The session says where to go.
    await settle();
    await resendTo("unconfirmed@openfn.org");
    expect(await screen.findByText("At /projects", {}, wait)).toBeTruthy();
    await waitFor(() => expect(toast).toHaveBeenCalledWith(authMessages.confirmSent, "info"));
  });

  it("sends a signed-out link to log in, and back to the link after signing in as Una", async () => {
    renderAt(link);
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "unconfirmed@openfn.org" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: FAKE_PASSWORD } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("button", { name: "Confirm my account" }, wait)).toBeTruthy();
  });

  it("sends a link opened while an MFA code is owed to two-factor, keeping the link", async () => {
    await expect(signIn("super@openfn.org")).rejects.toMatchObject({ code: "mfa_required" });
    renderAt(link);
    expect(await screen.findByText(`At /users/two-factor?return_to=${encodeURIComponent(link)}`, {}, wait)).toBeTruthy();
  });

  it("confirms Una's account on pressing, then toasts it on the projects list", async () => {
    await signIn("unconfirmed@openfn.org");
    const toast = renderAt(link);
    await confirm();
    expect(await screen.findByText("At /projects", {}, wait)).toBeTruthy();
    await waitFor(() => expect(toast.mock.calls).toEqual([[authMessages.confirmDone, "info"]]));
    const me = await request<{ data: { attributes: { confirmed_at: string | null } } }>("GET", "/api/me");
    expect(me.data.attributes.confirmed_at).not.toBeNull();
  });

  it("sends Una on with no message once she's confirmed", async () => {
    await signIn("unconfirmed@openfn.org");
    await request("PUT", `/api/confirmations/${FAKE_CONFIRM_TOKEN}`);
    const toast = renderAt(link);
    expect(await screen.findByText("At /projects", {}, wait)).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  it("shows an unknown link is invalid on the page, and stays", async () => {
    await signIn("unconfirmed@openfn.org");
    renderAt("/users/confirm/not-a-real-token");
    await confirm();
    expect(await screen.findByText(authMessages.confirmInvalid, {}, wait)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm my account" })).toBeTruthy();
    expect(screen.queryByText(/^At /)).toBeNull();
  });

  // Amy is confirmed, so the page sends her on before the button; the server's refusal is what's tested.
  it("refuses Una's link to anyone else", async () => {
    await signIn("demo@openfn.org");
    await expect(request("PUT", `/api/confirmations/${FAKE_CONFIRM_TOKEN}`)).rejects.toMatchObject({ code: "not_found" });
  });

  it("shows Register on the resend page when the instance allows sign-up, and no links on the link page", async () => {
    authConfig.allowSignup = true;
    renderAt("/users/confirm");
    expect(await screen.findByRole("link", { name: "Register" }, wait)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
    cleanup();
    await signIn("unconfirmed@openfn.org");
    renderAt(link);
    await screen.findByRole("button", { name: "Confirm my account" }, wait);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("has no Register link when the instance doesn't allow sign-up", async () => {
    renderAt("/users/confirm");
    await settle();
    expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Register" })).toBeNull();
  });

  it("shows a failure it doesn't expect in the card", async () => {
    await signIn("unconfirmed@openfn.org");
    failNext("PUT /api/confirmations/:token", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt(link);
    await confirm();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
  });

  it("shows a session that fails to load on the link page, rather than nothing", async () => {
    await signIn("unconfirmed@openfn.org");
    failNext("GET /api/session", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt(link);
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm my account" })).toBeTruthy();
  });
});

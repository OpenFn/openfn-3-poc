import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, FAKE_RESET_TOKEN, failNext, resetFakeApi, setAllowSignup } from "@/api/testing";
import AuthLoginPageQuery from "@/pages/auth/login/AuthLoginPage.query";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AuthResetPasswordPageQuery from "./AuthResetPasswordPage.query";

const wait = { timeout: 3000 };
const NEW_PASSWORD = "a-brand-new-password";

function Where() {
  return <p>At {useLocation().pathname}</p>;
}

function renderAt(path: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <Routes>
            <Route path="/users/log_in" element={<AuthLoginPageQuery />} />
            <Route path="/users/reset_password" element={<AuthResetPasswordPageQuery />} />
            <Route path="/users/reset_password/:token" element={<AuthResetPasswordPageQuery />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

const askFor = (email: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Send instructions to reset password" }));
};
const resetTo = (password: string, confirmation = password) => {
  fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
};
const signIn = (password: string) => request("POST", "/api/session", { email: "editor@openfn.org", password });
const sentMessage = "If your email is in our system, you will receive instructions to reset your password shortly.";
const deadLink = "Reset password link is invalid or it has expired.";

describe("AuthResetPasswordPageQuery", () => {
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

  it.each(["editor@openfn.org", "nobody@example.com"])("asking for a link for %s goes to log in with the same message", async (email) => {
    renderAt("/users/reset_password");
    askFor(email);
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(sentMessage);
  });

  it("resets Esther's password with the link, goes to log in, and only the new password signs in", async () => {
    renderAt(`/users/reset_password/${FAKE_RESET_TOKEN}`);
    resetTo(NEW_PASSWORD);
    expect(await screen.findByRole("button", { name: "Log in" }, wait)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Password reset successfully.");
    await expect(signIn(FAKE_PASSWORD)).rejects.toMatchObject({ code: "invalid_credentials" });
    await expect(signIn(NEW_PASSWORD)).resolves.toBeTruthy();
  });

  const expectDeadLink = async (token: string) => {
    renderAt(`/users/reset_password/${token}`);
    resetTo(NEW_PASSWORD);
    expect(await screen.findByRole("button", { name: "Send instructions to reset password" }, wait)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(deadLink);
  };

  it("with a link already used, goes back to asking for a new one and says why", async () => {
    await request("PUT", `/api/password_resets/${FAKE_RESET_TOKEN}`, { password: NEW_PASSWORD });
    await expectDeadLink(FAKE_RESET_TOKEN);
  });

  it("with an unknown link, goes back to asking for a new one and says why", () => expectDeadLink("not-a-real-token"));

  it("shows the server's refusal of a short password under New password, and stays", async () => {
    renderAt(`/users/reset_password/${FAKE_RESET_TOKEN}`);
    resetTo("short");
    expect(await screen.findByText("should be at least 12 character(s)", {}, wait)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset password" })).toBeTruthy();
  });

  it("says the passwords don't match under Confirm new password, and sends nothing", async () => {
    renderAt(`/users/reset_password/${FAKE_RESET_TOKEN}`);
    resetTo(NEW_PASSWORD, "something-else-entirely");
    expect(screen.getByText("Your passwords do not match.")).toBeTruthy();
    // The link is still unused: it resets now.
    await expect(request("PUT", `/api/password_resets/${FAKE_RESET_TOKEN}`, { password: NEW_PASSWORD })).resolves.toBeUndefined();
  });

  it("sends someone signed in to the projects list", async () => {
    await signIn(FAKE_PASSWORD);
    renderAt("/users/reset_password");
    expect(await screen.findByText("At /projects", {}, wait)).toBeTruthy();
  });

  it("has no Register link when the instance doesn't allow sign-up", async () => {
    renderAt("/users/reset_password");
    // Past the fake server's answer to the instance.
    await vi.advanceTimersByTimeAsync(400);
    expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Register" })).toBeNull();
  });

  it("shows Register when the instance allows sign-up", async () => {
    setAllowSignup();
    renderAt(`/users/reset_password/${FAKE_RESET_TOKEN}`);
    expect(await screen.findByRole("link", { name: "Register" }, wait)).toBeTruthy();
  });

  it("shows a failure it doesn't expect in the card, and a dead link after it still says why", async () => {
    failNext("PUT /api/password_resets/:token", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt("/users/reset_password/not-a-real-token");
    resetTo(NEW_PASSWORD);
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByRole("button", { name: "Send instructions to reset password" }, wait)).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(deadLink);
  });
});

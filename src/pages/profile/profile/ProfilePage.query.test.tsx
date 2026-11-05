import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { FAKE_BACKUP_CODE, FAKE_MFA_CODE, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { stepUp } from "@/api/session";
import { request } from "@/api/client";
import { ToastProvider } from "@/components/primitives/Toast";
import { session, users } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import ProfilePageQuery from "./ProfilePage.query";

const wait = { timeout: 3000 };
const amy = session.user; // a superuser
const esther = users.find((u) => u.id === "user-esther")!;

/** The profile, as whoever is signed in on the fake server, with stand-ins for where it moves you on. */
function renderRoute(path = "/profile") {
  render(
    <ApiProvider retry={false}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/profile" element={<ProfilePageQuery />} />
              <Route path="/profile/:userId/delete" element={<ProfilePageQuery />} />
              <Route path="/projects" element={<p>Projects page</p>} />
              <Route path="/profile/auth/backup_codes" element={<p>Backup codes page</p>} />
              <Route path="/users/log_out" element={<p>Signed out</p>} />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

const form = async (id: string) => {
  await waitFor(() => expect(document.getElementById(id)).not.toBeNull(), wait);
  return within(document.getElementById(id)!);
};
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
/** The error shows, and on this field: it is marked invalid. */
async function expectFieldError(input: HTMLElement, message: string) {
  expect(await screen.findByText(message, {}, wait)).toBeTruthy();
  expect(input.getAttribute("aria-invalid")).toBe("true");
}

async function confirmPassword() {
  const dialog = await screen.findByRole("dialog", { name: "Confirm access" }, wait);
  type(within(dialog).getByLabelText(/Password/), FAKE_PASSWORD);
  fireEvent.click(within(dialog).getByRole("button", { name: "Confirm" }));
}

describe("ProfilePageQuery", () => {
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

  it("loads you from the API", async () => {
    renderRoute();
    expect(await screen.findByRole("heading", { name: `${amy.firstName} ${amy.lastName}` }, wait)).toBeTruthy();
  });

  it("shows the server's words when loading fails", async () => {
    failNext("GET /api/me", { status: 500, code: "internal", detail: "Something went wrong." });
    renderRoute();
    expect(await screen.findByText("Something went wrong.", {}, wait)).toBeTruthy();
  });

  describe("basic information", () => {
    it("saves, and the page shows the new name", async () => {
      renderRoute();
      const basic = await form("basic-info-form");
      type(basic.getByLabelText(/First name/), "Ama");
      fireEvent.submit(document.getElementById("basic-info-form")!);
      expect(await screen.findByText("User information updated successfully", {}, wait)).toBeTruthy();
      expect(await screen.findByRole("heading", { name: `Ama ${amy.lastName}` }, wait)).toBeTruthy();
    });

    it("puts the server's 422 under its field", async () => {
      failNext("PATCH /api/users/:id", { status: 422, code: "invalid", errors: [{ code: "too_long", detail: "should be at most 160 character(s)", pointer: "#/first_name" }] });
      renderRoute();
      const basic = await form("basic-info-form");
      type(basic.getByLabelText(/First name/), "Ama");
      fireEvent.submit(document.getElementById("basic-info-form")!);
      await expectFieldError(basic.getByLabelText(/First name/), "should be at most 160 character(s)");
    });
  });

  describe("changing email", () => {
    const submit = async (email: string, password: string) => {
      const emailForm = await form("email-form");
      type(emailForm.getByLabelText(/New email address/), email);
      type(emailForm.getByLabelText(/Enter password to confirm/), password);
      fireEvent.submit(document.getElementById("email-form")!);
      return emailForm;
    };

    it("puts a wrong current password on its field", async () => {
      renderRoute();
      const emailForm = await submit("amy.new@example.org", "not-the-password");
      await expectFieldError(emailForm.getByLabelText(/Enter password to confirm/), "is not valid");
    });

    it("compares the new email exactly for 'has not changed', and any case for 'has already been taken'", async () => {
      renderRoute();
      const emailForm = await submit(amy.email.toUpperCase(), FAKE_PASSWORD);
      expect(await emailForm.findByText("has already been taken", {}, wait)).toBeTruthy();
      expect(screen.queryByText("has not changed")).toBeNull();
    });

    it("asks for the change and says an email is on its way", async () => {
      renderRoute();
      await submit("amy.new@example.org", FAKE_PASSWORD);
      expect(await screen.findByText("You will receive an email with instructions shortly.", {}, wait)).toBeTruthy();
      const me = await request<{ data: { attributes: { email: string; pending_email: string } } }>("GET", "/api/me");
      expect(me.data.attributes).toMatchObject({ email: amy.email, pending_email: "amy.new@example.org" });
    });
  });

  describe("changing password", () => {
    const submit = async (password: string, current = FAKE_PASSWORD) => {
      const passwordForm = await form("password-form");
      type(passwordForm.getByLabelText(/^New password/), password);
      type(passwordForm.getByLabelText(/Confirm new password/), password);
      type(passwordForm.getByLabelText(/Current password/), current);
      fireEvent.submit(document.getElementById("password-form")!);
      return passwordForm;
    };

    it("changes it, then lands on the projects, as Lightning does", async () => {
      renderRoute();
      await submit("a-new-password-123");
      expect(await screen.findByText("Projects page", {}, wait)).toBeTruthy();
      expect(await screen.findByText("Password changed successfully.", {}, wait)).toBeTruthy();
      // The new one signs in; the old one doesn't.
      await expect(request("POST", "/api/session", { email: amy.email, password: FAKE_PASSWORD })).rejects.toMatchObject({ code: "invalid_credentials" });
      await request("POST", "/api/session", { email: amy.email, password: "a-new-password-123" });
    });

    it("puts a wrong current password on its field", async () => {
      renderRoute();
      const passwordForm = await submit("a-new-password-123", "not-the-password");
      await expectFieldError(passwordForm.getByLabelText(/Current password/), "is not valid");
    });

    it("puts the server's 422 under the new password", async () => {
      failNext("PATCH /api/users/:id", { status: 422, code: "invalid", errors: [{ code: "too_long", detail: "should be at most 72 character(s)", pointer: "#/password" }] });
      renderRoute();
      const passwordForm = await submit("a-new-password-123");
      await expectFieldError(passwordForm.getByLabelText(/^New password/), "should be at most 72 character(s)");
    });
  });

  describe("MFA", () => {
    const startSetup = async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Set up MFA" }, wait));
      expect(await screen.findByRole("img", { name: "QR code for your authenticator app" }, wait)).toBeTruthy();
      return within(document.getElementById("set_totp_form")!);
    };

    it("puts a wrong code on its field", async () => {
      renderRoute();
      const setup = await startSetup();
      type(setup.getByLabelText(/Verify the code/), "000000");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      await expectFieldError(setup.getByLabelText(/Verify the code/), "invalid code");
    });

    it("goes on to the backup codes after a first setup", async () => {
      renderRoute();
      const setup = await startSetup();
      type(setup.getByLabelText(/Verify the code/), FAKE_MFA_CODE);
      fireEvent.submit(document.getElementById("set_totp_form")!);
      expect(await screen.findByText("Backup codes page", {}, wait)).toBeTruthy();
      // With ten new codes, in place of the old ones.
      const mfa = await request<{ data: { backup_codes: { code: string }[] } }>("GET", "/api/me/mfa");
      expect(mfa.data.backup_codes).toHaveLength(10);
      expect(mfa.data.backup_codes.map((c) => c.code)).not.toContain(FAKE_BACKUP_CODE);
    });

    it("asks for the password before turning MFA off", async () => {
      await request("POST", "/api/session", { email: "super@openfn.org", password: FAKE_PASSWORD, mfa_code: FAKE_MFA_CODE });
      renderRoute("/profile");
      fireEvent.click(await screen.findByRole("button", { name: "Disable MFA" }, wait));
      fireEvent.click(await screen.findByRole("button", { name: "Disable" }, wait));
      await confirmPassword();
      expect(await screen.findByText("MFA Disabled", {}, wait)).toBeTruthy();
      expect(await screen.findByRole("button", { name: "Set up MFA" }, wait)).toBeTruthy();
    });
  });

  it("puts the experimental features switch back, with the server's words, when the save fails", async () => {
    failNext("PATCH /api/users/:id", { status: 403, code: "forbidden", detail: "You are not allowed to do that." });
    renderRoute();
    await form("basic-info-form");
    const toggle = document.getElementById("preferences_experimental_features")!;
    fireEvent.click(toggle);
    expect(await screen.findByText("You are not allowed to do that.", {}, wait)).toBeTruthy();
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  describe("deleting your account", () => {
    it("asks for the password, then schedules the deletion and signs you out", async () => {
      await request("POST", "/api/session", { email: esther.email, password: FAKE_PASSWORD });
      renderRoute(`/profile/${esther.id}/delete`);
      const dialog = await screen.findByRole("dialog", { name: "Delete user" }, wait);
      type(within(dialog).getByLabelText(/User email/), esther.email);
      fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));
      await confirmPassword();
      expect(await screen.findByText("Signed out", {}, wait)).toBeTruthy();
      expect(await screen.findByText("User scheduled for deletion", {}, wait)).toBeTruthy();
      // Disabled with it, so signing in again is refused.
      await expect(request("POST", "/api/session", { email: esther.email, password: FAKE_PASSWORD })).rejects.toMatchObject({ code: "invalid_credentials" });
    });

    it("shows the server's refusal in the dialog", async () => {
      await stepUp({ password: FAKE_PASSWORD });
      renderRoute(`/profile/${amy.id}/delete`);
      const dialog = await screen.findByRole("dialog", { name: "Delete user" }, wait);
      type(within(dialog).getByLabelText(/User email/), amy.email);
      fireEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));
      expect(await within(dialog).findByText("You can't delete a superuser account.", {}, wait)).toBeTruthy();
    });

    it("refuses someone else's, with Lightning's words and no dialog", async () => {
      renderRoute(`/profile/${esther.id}/delete`);
      expect(await screen.findByText("You can't perform this action", {}, wait)).toBeTruthy();
      expect(screen.queryByRole("dialog", { name: "Delete user" })).toBeNull();
    });
  });
});

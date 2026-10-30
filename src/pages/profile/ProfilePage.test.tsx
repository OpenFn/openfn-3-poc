import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "../../routing/router";
import { ToastProvider } from "../../components/primitives/Toast";
import { RequestError } from "../../utils/errors";
import { pickOption } from "../../test/select";
import ProfilePage, { type ProfilePageProps } from "./ProfilePage";
import { tooltipOf } from "../../test/tooltip";

const data = (): Omit<ProfilePageProps, `on${string}`> => ({
  user: {
    id: "u1",
    firstName: "Amy",
    lastName: "Admin",
    email: "amy@example.org",
    contactPreference: "critical",
    insertedAt: "2024-03-12T09:00:00Z",
  },
  mfa: { enabled: false, backupCodesHref: "/profile/auth/backup_codes" },
  github: { connectHref: "https://github.com/login/oauth/authorize?client_id=x", status: "none" },
  experimentalFeatures: false,
  deletion: { href: "/profile/u1/delete", hasActivityInProjects: false, blocked: false },
  deleting: false,
});

// No SessionContext: the page must not reach for the demo session.
function renderPage(props: Partial<ProfilePageProps> = {}) {
  const router: Router = {
    navigate: vi.fn(),
    useHref: (to) => to,
    useLocation: () => ({ pathname: "/profile", search: "", hash: "" }),
  };
  const done = () => vi.fn().mockResolvedValue(undefined);
  const handlers = {
    onSaveBasicInfo: done(),
    onChangeEmail: done(),
    onChangePassword: done(),
    onStartMfaSetup: vi.fn().mockResolvedValue({ secret: "JBSWY3DPEHPK3PXP", qrCodeSrc: "data:image/svg+xml,qr" }),
    onConfirmMfa: done(),
    onDisableMfa: done(),
    onDisconnectGithub: done(),
    onSetExperimentalFeatures: done(),
    onDeleteAccount: done(),
    onCloseDelete: vi.fn(),
  };
  const page = (next: Partial<ProfilePageProps>) => (
    <RouterProvider value={router}>
      <ToastProvider>
        <ProfilePage {...data()} {...handlers} {...next} />
      </ToastProvider>
    </RouterProvider>
  );
  const { rerender } = render(page(props));
  return { ...handlers, rerender: (next: Partial<ProfilePageProps>) => rerender(page(next)) };
}

const form = (id: string) => within(document.getElementById(id)!);
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const input = (el: HTMLElement) => el as HTMLInputElement;
const dialog = () => screen.getByRole("dialog");
const mfaSwitch = () => document.getElementById("toggle-mfa-switch")!;

describe("ProfilePage", () => {
  it("shows who the user is and links to account deletion", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "Amy Admin" })).toBeTruthy();
    expect(screen.getByText("Email: amy@example.org")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Delete my account" }).getAttribute("href")).toBe("/profile/u1/delete");
  });

  describe("forms", () => {
    it("saves basic information as typed, and shows the host's field error", async () => {
      const onSaveBasicInfo = vi.fn().mockRejectedValue(new RequestError("invalid", { fieldErrors: { firstName: ["can't be blank"] } }));
      renderPage({ onSaveBasicInfo });
      const basic = form("basic-info-form");
      type(basic.getByLabelText(/First name/), "Ann");
      await pickOption(basic.getByRole("button", { name: /^Contact preference/ }), "Anytime");
      fireEvent.submit(document.getElementById("basic-info-form")!);
      await waitFor(() => expect(onSaveBasicInfo).toHaveBeenCalledWith({ firstName: "Ann", lastName: "Admin", contactPreference: "any" }));
      expect(await basic.findByText("can't be blank")).toBeTruthy();
      expect(input(basic.getByLabelText(/First name/)).value).toBe("Ann");
    });

    it("enables Save only once basic information changes, and won't send a blank name", () => {
      const { onSaveBasicInfo } = renderPage();
      const basic = form("basic-info-form");
      const save = () => basic.getByRole("button", { name: "Save" }) as HTMLButtonElement;
      expect(save().disabled).toBe(true);
      type(basic.getByLabelText(/First name/), " ");
      expect(save().disabled).toBe(false);
      fireEvent.submit(document.getElementById("basic-info-form")!);
      expect(basic.getByText("can't be blank")).toBeTruthy();
      expect(onSaveBasicInfo).not.toHaveBeenCalled();
    });

    it("won't send a blank or invalid email address", () => {
      const { onChangeEmail } = renderPage();
      const email = form("email-form");
      type(email.getByLabelText(/Enter password to confirm/), "hunter2hunter2");
      fireEvent.submit(document.getElementById("email-form")!);
      expect(email.getByText("can't be blank")).toBeTruthy();
      type(email.getByLabelText(/New email address/), "not-an-email");
      fireEvent.submit(document.getElementById("email-form")!);
      expect(email.getByText("must be a valid email address")).toBeTruthy();
      expect(onChangeEmail).not.toHaveBeenCalled();
    });

    it("empties the email form once the host has the request", async () => {
      const { onChangeEmail } = renderPage();
      const email = form("email-form");
      type(email.getByLabelText(/New email address/), "ann@example.org");
      type(email.getByLabelText(/Enter password to confirm/), "hunter2hunter2");
      fireEvent.submit(document.getElementById("email-form")!);
      await waitFor(() => expect(onChangeEmail).toHaveBeenCalled());
      await waitFor(() => expect(input(email.getByLabelText(/New email address/)).value).toBe(""));
      expect(input(email.getByLabelText(/Enter password to confirm/)).value).toBe("");
    });

    it("asks to change email with the new address and the current password, and keeps the form when the password is wrong", async () => {
      const onChangeEmail = vi.fn().mockRejectedValue(new RequestError("invalid", { fieldErrors: { currentPassword: ["is not valid"] } }));
      renderPage({ onChangeEmail });
      const email = form("email-form");
      type(email.getByLabelText(/New email address/), "ann@example.org");
      type(email.getByLabelText(/Enter password to confirm/), "hunter2hunter2");
      fireEvent.submit(document.getElementById("email-form")!);
      await waitFor(() => expect(onChangeEmail).toHaveBeenCalledWith({ email: "ann@example.org", currentPassword: "hunter2hunter2" }));
      expect(await email.findByText("is not valid")).toBeTruthy();
      expect(input(email.getByLabelText(/New email address/)).value).toBe("ann@example.org");
    });

    it("shows a refusal with no field errors in the email card", async () => {
      renderPage({ onChangeEmail: vi.fn().mockRejectedValue(new RequestError("Something went wrong")) });
      const email = form("email-form");
      type(email.getByLabelText(/New email address/), "ann@example.org");
      type(email.getByLabelText(/Enter password to confirm/), "hunter2hunter2");
      fireEvent.submit(document.getElementById("email-form")!);
      expect(await email.findByText("Something went wrong")).toBeTruthy();
    });

    it("restarts the basic information form for a new user, and keeps what's typed for the same one", () => {
      const { rerender } = renderPage();
      const firstName = () => input(form("basic-info-form").getByLabelText(/First name/));
      type(firstName(), "Ann");
      rerender({ user: { ...data().user, lastName: "Other" } });
      expect(firstName().value).toBe("Ann");
      rerender({ user: { ...data().user, id: "u2", firstName: "Bea" } });
      expect(firstName().value).toBe("Bea");
    });

    it("changes the password with all three fields, then empties them", async () => {
      const { onChangePassword } = renderPage();
      const password = form("password-form");
      type(password.getByLabelText(/^New password/), "correct-horse-battery");
      type(password.getByLabelText(/^Confirm new password/), "correct-horse-battery");
      type(password.getByLabelText(/^Current password/), "old-password-123");
      fireEvent.submit(document.getElementById("password-form")!);
      await waitFor(() =>
        expect(onChangePassword).toHaveBeenCalledWith({
          password: "correct-horse-battery",
          passwordConfirmation: "correct-horse-battery",
          currentPassword: "old-password-123",
        })
      );
      await waitFor(() => expect(input(password.getByLabelText(/^New password/)).value).toBe(""));
      expect(input(password.getByLabelText(/^Confirm new password/)).value).toBe("");
      expect(input(password.getByLabelText(/^Current password/)).value).toBe("");
    });

    it("won't send a password whose confirmation doesn't match", () => {
      const { onChangePassword } = renderPage();
      const password = form("password-form");
      type(password.getByLabelText(/^New password/), "correct-horse-battery");
      type(password.getByLabelText(/^Confirm new password/), "correct-horse-batterz");
      type(password.getByLabelText(/^Current password/), "old-password-123");
      fireEvent.submit(document.getElementById("password-form")!);
      expect(password.getByText("does not match password")).toBeTruthy();
      expect(onChangePassword).not.toHaveBeenCalled();
    });

    it("keeps what was typed in the password form when the host refuses it", async () => {
      const onChangePassword = vi.fn().mockRejectedValue(new RequestError("invalid", { fieldErrors: { currentPassword: ["is not valid"] } }));
      renderPage({ onChangePassword });
      const password = form("password-form");
      type(password.getByLabelText(/^New password/), "correct-horse-battery");
      type(password.getByLabelText(/^Confirm new password/), "correct-horse-battery");
      type(password.getByLabelText(/^Current password/), "wrong-password-1");
      fireEvent.submit(document.getElementById("password-form")!);
      expect(await password.findByText("is not valid")).toBeTruthy();
      expect(input(password.getByLabelText(/^New password/)).value).toBe("correct-horse-battery");
    });

    it("won't send a password shorter than 12 characters", () => {
      const { onChangePassword } = renderPage();
      const password = form("password-form");
      type(password.getByLabelText(/^New password/), "short");
      type(password.getByLabelText(/^Confirm new password/), "short");
      type(password.getByLabelText(/^Current password/), "old-password-123");
      fireEvent.submit(document.getElementById("password-form")!);
      expect(password.getByText("should be at least 12 character(s)")).toBeTruthy();
      expect(onChangePassword).not.toHaveBeenCalled();
    });
  });

  describe("MFA", () => {
    it("sets up MFA with the secret from the host's reply, and sends the code typed", async () => {
      const { onStartMfaSetup, onConfirmMfa } = renderPage();
      expect(document.getElementById("set_totp_form")).toBeNull();
      fireEvent.click(mfaSwitch());
      await waitFor(() => expect(onStartMfaSetup).toHaveBeenCalled());
      expect((await screen.findByAltText(/QR code/)).getAttribute("src")).toBe("data:image/svg+xml,qr");
      expect(screen.queryByText("JBSWY3DPEHPK3PXP")).toBeNull();
      fireEvent.click(screen.getByText("this secret key"));
      expect(within(dialog()).getByText("JBSWY3DPEHPK3PXP")).toBeTruthy();
      fireEvent.click(within(dialog()).getByRole("button", { name: /close/i }));
      const totp = form("set_totp_form");
      type(totp.getByLabelText(/Verify the code from the app/), "123456");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      await waitFor(() => expect(onConfirmMfa).toHaveBeenCalledWith("123456"));
      await waitFor(() => expect(document.getElementById("set_totp_form")).toBeNull());
    });

    it("keeps the setup open with the host's error when the code is wrong", async () => {
      const onConfirmMfa = vi.fn().mockRejectedValue(new RequestError("invalid", { fieldErrors: { code: ["invalid code"] } }));
      renderPage({ onConfirmMfa });
      fireEvent.click(mfaSwitch());
      type(await screen.findByLabelText(/Verify the code from the app/), "000000");
      const totp = form("set_totp_form");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      expect(await totp.findByText("invalid code")).toBeTruthy();
      expect(document.getElementById("set_totp_form")).toBeTruthy();
    });

    it("says why setup couldn't start, and leaves the switch off", async () => {
      renderPage({ onStartMfaSetup: vi.fn().mockRejectedValue(new RequestError("Something went wrong")) });
      fireEvent.click(mfaSwitch());
      expect(await screen.findByText("Something went wrong")).toBeTruthy();
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("false");
      expect(document.getElementById("set_totp_form")).toBeNull();
    });

    it("won't send a code that isn't six digits, and calls a blank one blank", async () => {
      const { onConfirmMfa } = renderPage();
      fireEvent.click(mfaSwitch());
      const code = await screen.findByLabelText(/Verify the code from the app/);
      const totp = form("set_totp_form");
      type(code, "12345");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      expect(totp.getByText("should be a 6 digit number")).toBeTruthy();
      type(code, "   ");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      expect(totp.getByText("can't be blank")).toBeTruthy();
      expect(onConfirmMfa).not.toHaveBeenCalled();
    });

    it("drops the secret on Cancel or switching off, and the next setup starts with it hidden", async () => {
      const { onStartMfaSetup } = renderPage();
      fireEvent.click(mfaSwitch());
      fireEvent.click(await screen.findByText("this secret key"));
      expect(within(dialog()).getByText("JBSWY3DPEHPK3PXP")).toBeTruthy();
      fireEvent.click(form("set_totp_form").getByText("Cancel"));
      expect(document.getElementById("set_totp_form")).toBeNull();
      expect(screen.queryByText("JBSWY3DPEHPK3PXP")).toBeNull();
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("false");

      fireEvent.click(mfaSwitch());
      await screen.findByAltText(/QR code/);
      expect(onStartMfaSetup).toHaveBeenCalledTimes(2);
      expect(screen.queryByText("JBSWY3DPEHPK3PXP")).toBeNull();
      fireEvent.click(mfaSwitch());
      expect(document.getElementById("set_totp_form")).toBeNull();
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("false");
    });

    it("asks for a new secret to set up another device", async () => {
      const { onStartMfaSetup } = renderPage({ mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } });
      fireEvent.click(screen.getByText("Setup another device instead"));
      await screen.findByAltText(/QR code/);
      expect(onStartMfaSetup).toHaveBeenCalledTimes(1);
      expect(screen.queryByText(/You have configured an authentication app/)).toBeNull();
    });

    it("keeps the disable dialog open with the host's error", async () => {
      renderPage({
        mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" },
        onDisableMfa: vi.fn().mockRejectedValue(new RequestError("Oops! Could not disable 2FA from your account. Please try again later")),
      });
      fireEvent.click(mfaSwitch());
      fireEvent.click(within(dialog()).getByRole("button", { name: "Disable" }));
      expect(await within(dialog()).findByText("Oops! Could not disable 2FA from your account. Please try again later")).toBeTruthy();
    });

    it("disables MFA after confirming, and links to the recovery codes", async () => {
      const { onDisableMfa, onStartMfaSetup } = renderPage({ mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } });
      expect(screen.getByRole("link", { name: "View" }).getAttribute("href")).toBe("/profile/auth/backup_codes");
      fireEvent.click(mfaSwitch());
      expect(onStartMfaSetup).not.toHaveBeenCalled();
      fireEvent.click(within(dialog()).getByRole("button", { name: "Disable" }));
      await waitFor(() => expect(onDisableMfa).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("closes the setup and turns the switch off when MFA is disabled while setting up another device", async () => {
      const { rerender } = renderPage({ mfa: { enabled: true, backupCodesHref: "/profile/auth/backup_codes" } });
      fireEvent.click(screen.getByText("Setup another device instead"));
      await screen.findByAltText(/QR code/);
      fireEvent.click(mfaSwitch());
      fireEvent.click(within(dialog()).getByRole("button", { name: "Disable" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      rerender({ mfa: { enabled: false, backupCodesHref: "/profile/auth/backup_codes" } });
      expect(document.getElementById("set_totp_form")).toBeNull();
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("false");
    });

    it("keeps the switch on after a confirmed setup until the host's props arrive", async () => {
      renderPage();
      fireEvent.click(mfaSwitch());
      type(await screen.findByLabelText(/Verify the code from the app/), "123456");
      fireEvent.submit(document.getElementById("set_totp_form")!);
      await waitFor(() => expect(document.getElementById("set_totp_form")).toBeNull());
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("true");
    });

    it("holds the switch while setup is starting, and Cancel while the code is being saved", async () => {
      let started!: (v: { secret: string; qrCodeSrc: string }) => void;
      let confirmed!: () => void;
      renderPage({
        onStartMfaSetup: vi.fn(() => new Promise<{ secret: string; qrCodeSrc: string }>((resolve) => (started = resolve))),
        onConfirmMfa: vi.fn(() => new Promise<void>((resolve) => (confirmed = resolve))),
      });
      fireEvent.click(mfaSwitch());
      await waitFor(() => expect((mfaSwitch() as HTMLButtonElement).disabled).toBe(true));
      expect(mfaSwitch().getAttribute("aria-checked")).toBe("true");
      started({ secret: "JBSWY3DPEHPK3PXP", qrCodeSrc: "data:image/svg+xml,qr" });
      type(await screen.findByLabelText(/Verify the code from the app/), "123456");
      expect((mfaSwitch() as HTMLButtonElement).disabled).toBe(false);
      fireEvent.submit(document.getElementById("set_totp_form")!);
      const cancel = form("set_totp_form").getByRole("button", { name: "Cancel" }) as HTMLButtonElement;
      await waitFor(() => expect(cancel.disabled).toBe(true));
      expect((mfaSwitch() as HTMLButtonElement).disabled).toBe(true);
      confirmed();
      await waitFor(() => expect(document.getElementById("set_totp_form")).toBeNull());
    });
  });

  describe("experimental features", () => {
    it("saves each flip", () => {
      const { onSetExperimentalFeatures } = renderPage();
      fireEvent.click(document.getElementById("preferences_experimental_features")!);
      expect(onSetExperimentalFeatures).toHaveBeenCalledWith(true);
      fireEvent.click(document.getElementById("preferences_experimental_features")!);
      expect(onSetExperimentalFeatures).toHaveBeenLastCalledWith(false);
    });

    it("shows the new state at once, and puts it back with the error if the save fails", async () => {
      let fail: (e: Error) => void = () => {};
      renderPage({ onSetExperimentalFeatures: vi.fn(() => new Promise<void>((_, reject) => (fail = reject))) });
      const toggle = document.getElementById("preferences_experimental_features")!;
      fireEvent.click(toggle);
      expect(toggle.getAttribute("aria-checked")).toBe("true");
      fail(new RequestError("Failed to update experimental features. Please try again."));
      expect(await screen.findByText("Failed to update experimental features. Please try again.")).toBeTruthy();
      expect(toggle.getAttribute("aria-checked")).toBe("false");
    });
  });

  describe("GitHub", () => {
    it("links to GitHub to connect or reconnect, and says when it isn't set up", async () => {
      const { rerender } = renderPage();
      const link = () => document.getElementById("connect-github-link")!;
      expect(link().getAttribute("href")).toBe("https://github.com/login/oauth/authorize?client_id=x");
      expect(link().textContent).toBe("Connect your GitHub Account");
      expect(link().getAttribute("target")).toBe("_blank");
      rerender({ github: { ...data().github, status: "expired" } });
      expect(link().textContent).toBe("Reconnect your GitHub Account");
      expect(await tooltipOf(link())).toBe("Your token has expired");
      rerender({ github: { connectHref: null, status: "none" } });
      expect((document.getElementById("github-oauth-not-enabled") as HTMLButtonElement).disabled).toBe(true);
    });

    it("disconnects after confirming", async () => {
      const { onDisconnectGithub } = renderPage({ github: { ...data().github, status: "connected" } });
      fireEvent.click(screen.getByRole("button", { name: "Disconnect from GitHub" }));
      fireEvent.click(within(dialog()).getByRole("button", { name: "Disconnect" }));
      await waitFor(() => expect(onDisconnectGithub).toHaveBeenCalled());
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("keeps the disconnect dialog open with the host's error", async () => {
      renderPage({
        github: { ...data().github, status: "connected" },
        onDisconnectGithub: vi.fn().mockRejectedValue(new RequestError("Oops! An error occurred while trying to remove the connection. Please try again")),
      });
      fireEvent.click(screen.getByRole("button", { name: "Disconnect from GitHub" }));
      fireEvent.click(within(dialog()).getByRole("button", { name: "Disconnect" }));
      expect(await within(dialog()).findByText("Oops! An error occurred while trying to remove the connection. Please try again")).toBeTruthy();
    });
  });

  describe("deleting the account", () => {
    it("keeps Delete disabled while the email doesn't match", () => {
      renderPage({ deleting: true });
      type(within(dialog()).getByLabelText(/User email/), "amy@example.com");
      expect((within(dialog()).getByRole("button", { name: "Delete account" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("opens only when the host says so", () => {
      renderPage();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("deletes once the email is typed, and closes on Cancel", async () => {
      const { onDeleteAccount, onCloseDelete } = renderPage({ deleting: true });
      const confirm = () => within(dialog()).getByRole("button", { name: "Delete account" }) as HTMLButtonElement;
      expect(confirm().disabled).toBe(true);
      type(within(dialog()).getByLabelText(/User email/), "amy@example.org");
      fireEvent.click(confirm());
      await waitFor(() => expect(onDeleteAccount).toHaveBeenCalledWith("amy@example.org"));
      fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
      expect(onCloseDelete).toHaveBeenCalled();
    });

    it("closes through onCloseDelete on Escape", async () => {
      const { onCloseDelete } = renderPage({ deleting: true });
      await userEvent.keyboard("{Escape}");
      expect(onCloseDelete).toHaveBeenCalled();
    });

    it("stays open with the host's refusal", async () => {
      renderPage({ deleting: true, onDeleteAccount: vi.fn().mockRejectedValue(new RequestError("You can't delete a superuser account.")) });
      type(within(dialog()).getByLabelText(/User email/), "amy@example.org");
      fireEvent.click(within(dialog()).getByRole("button", { name: "Delete account" }));
      expect(await within(dialog()).findByText("You can't delete a superuser account.")).toBeTruthy();
    });

    it("notes project activity, and only explains when deletion is blocked", () => {
      const { rerender } = renderPage({ deleting: true, deletion: { ...data().deletion, hasActivityInProjects: true } });
      expect(dialog().textContent).toContain("you still have activity related to active projects");
      rerender({ deleting: true, deletion: { ...data().deletion, hasActivityInProjects: true, blocked: true } });
      expect(dialog().textContent).toContain("Your account cannot be deleted until their auditable activities have also been purged.");
      expect(within(dialog()).queryByRole("button", { name: "Delete account" })).toBeNull();
    });
  });

  it("follows new MFA and experimental features props from the host", () => {
    const { rerender } = renderPage();
    rerender({ mfa: { ...data().mfa, enabled: true }, experimentalFeatures: true });
    expect(mfaSwitch().getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText(/You have configured an authentication app/)).toBeTruthy();
    expect(document.getElementById("preferences_experimental_features")!.getAttribute("aria-checked")).toBe("true");
  });
});

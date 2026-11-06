import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import { RequestError } from "@/utils/errors";
import AuthResetPasswordPage, { type AuthResetPasswordPageProps } from "./AuthResetPasswordPage";

const signedOut = { step: "request" as const, allowSignup: false, flash: null };
const open = (data: Partial<Omit<AuthResetPasswordPageProps, "onRequest" | "onReset">> = {}) =>
  renderPage(AuthResetPasswordPage, { ...signedOut, ...data }, ["onRequest", "onReset"]);
const typeEmail = (email: string) => fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: email } });
const sendInstructions = () => fireEvent.click(screen.getByRole("button", { name: "Send instructions to reset password" }));
const typePasswords = (password: string, confirmation: string) => {
  fireEvent.change(screen.getByLabelText(/^New password/), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/^Confirm new password/), { target: { value: confirmation } });
};
const resetPassword = () => fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

describe("AuthResetPasswordPage", () => {
  it("asks for an email in Lightning's words before sending, and sends it", () => {
    const page = open();
    sendInstructions();
    expect(screen.getByText("can't be blank")).toBeTruthy();
    typeEmail("amy");
    sendInstructions();
    expect(screen.getByText("must have the @ sign and no spaces")).toBeTruthy();
    expect(page.calls("onRequest")).toHaveLength(0);
    typeEmail("amy@openfn.org");
    sendInstructions();
    expect(page.calls("onRequest")).toEqual([[{ email: "amy@openfn.org" }]]);
  });

  it("shows a carried message at the top of the card, and a refusal in its place", async () => {
    const page = open({ flash: { tone: "info", message: "Reset password link is invalid or it has expired." } });
    expect(screen.getByRole("status").textContent).toContain("Reset password link is invalid or it has expired.");
    typeEmail("amy@openfn.org");
    sendInstructions();
    await page.reject("onRequest", new Error("Something went wrong in Lightning."));
    expect(screen.getByText("Something went wrong in Lightning.")).toBeTruthy();
    expect(screen.queryByText("Reset password link is invalid or it has expired.")).toBeNull();
  });

  it("shows a carried danger message as an error", () => {
    open({ flash: { tone: "danger", message: "Reset password link is invalid or it has expired." } });
    expect(screen.getByRole("alert").textContent).toContain("Reset password link is invalid or it has expired.");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("needs a new password, and a confirmation that matches it, before sending", () => {
    const page = open({ step: "reset" });
    resetPassword();
    expect(screen.getByText("can't be blank")).toBeTruthy();
    typePasswords("a-long-new-password", "another-password");
    resetPassword();
    expect(screen.getByText("Your passwords do not match.")).toBeTruthy();
    expect(page.calls("onReset")).toHaveLength(0);
    typePasswords("a-long-new-password", "a-long-new-password");
    resetPassword();
    expect(page.calls("onReset")).toEqual([[{ password: "a-long-new-password", passwordConfirmation: "a-long-new-password" }]]);
  });

  it("shows the server's word on the new password under it", async () => {
    const page = open({ step: "reset" });
    typePasswords("short", "short");
    resetPassword();
    await page.reject("onReset", new RequestError("The request body is not valid.", { fieldErrors: { password: ["should be at least 12 character(s)"] } }));
    expect(screen.getByText("should be at least 12 character(s)")).toBeTruthy();
    expect(screen.queryByText("The request body is not valid.")).toBeNull();
  });

  it("shows why Register may be missing when the instance doesn't load", () => {
    open({ status: { state: "error", message: "Something went wrong in Lightning." } });
    expect(screen.getByText("Something went wrong in Lightning.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send instructions to reset password" })).toBeTruthy();
  });
});

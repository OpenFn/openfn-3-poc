import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import AuthConfirmAccountPage, { type AuthConfirmAccountPageProps } from "./AuthConfirmAccountPage";

const open = (data: Partial<Omit<AuthConfirmAccountPageProps, "onResend" | "onConfirm">> = {}) =>
  renderPage(AuthConfirmAccountPage, { step: "resend", allowSignup: false, ...data }, ["onResend", "onConfirm"]);
const resend = () => fireEvent.click(screen.getByRole("button", { name: "Resend confirmation instructions" }));
const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Confirm my account" }));

describe("AuthConfirmAccountPage", () => {
  it("asks for an email in Lightning's words before resending, and sends it", () => {
    const page = open();
    resend();
    expect(screen.getByText("can't be blank")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "amy" } });
    resend();
    expect(screen.getByText("must have the @ sign and no spaces")).toBeTruthy();
    expect(page.calls("onResend")).toHaveLength(0);
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "una@openfn.org" } });
    resend();
    expect(page.calls("onResend")).toEqual([[{ email: "una@openfn.org" }]]);
  });

  it("shows a refused resend in the card, and keeps the email", async () => {
    const page = open();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "una@openfn.org" } });
    resend();
    await page.reject("onResend", new Error("Something went wrong in Lightning."));
    expect(screen.getByText("Something went wrong in Lightning.")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /^Email/ }).getAttribute("value")).toBe("una@openfn.org");
  });

  it("confirms with one press, shows it's working, and shows a refusal in the card", async () => {
    const page = open({ step: "confirm" });
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    confirm();
    expect(page.calls("onConfirm")).toHaveLength(1);
    expect(screen.getByRole("button", { busy: true })).toBeTruthy();
    await page.reject("onConfirm", new Error("User confirmation link is invalid or it has expired."));
    expect(screen.getByText("User confirmation link is invalid or it has expired.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm my account" })).toBeTruthy();
  });

  it("shows why Register may be missing when the instance doesn't load", () => {
    open({ status: { state: "error", message: "Something went wrong in Lightning." } });
    expect(screen.getByText("Something went wrong in Lightning.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy();
  });
});

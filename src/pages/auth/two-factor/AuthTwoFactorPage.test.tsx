import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import AuthTwoFactorPage from "./AuthTwoFactorPage";

const open = (method: "totp" | "backup_code" = "totp") =>
  renderPage(AuthTwoFactorPage, { method, otherMethodHref: "/users/two-factor?authentication_type=other" }, ["onVerify"]);
const verify = () => fireEvent.click(screen.getByRole("button", { name: "Verify" }));

describe("AuthTwoFactorPage", () => {
  it("asks for the authenticator code, and says a blank one can't be blank", () => {
    const page = open();
    verify();
    expect(screen.getByText("can't be blank")).toBeTruthy();
    expect(page.calls("onVerify")).toHaveLength(0);
    expect(screen.getByRole("link", { name: "Use your backup code" }).getAttribute("href")).toBe("/users/two-factor?authentication_type=other");
  });

  it("sends the code and shows a refusal", async () => {
    const page = open();
    fireEvent.change(screen.getByRole("textbox", { name: /Authentication Code/ }), { target: { value: "000000" } });
    verify();
    expect(page.calls("onVerify")).toEqual([["000000"]]);
    await page.reject("onVerify", new Error("Invalid two-factor authentication code"));
    expect(screen.getByText("Invalid two-factor authentication code")).toBeTruthy();
  });

  it("asks for a backup code instead, with a link back to the authenticator", () => {
    open("backup_code");
    expect(screen.getByRole("textbox", { name: /Backup Code/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Use your authenticator app" })).toBeTruthy();
  });
});

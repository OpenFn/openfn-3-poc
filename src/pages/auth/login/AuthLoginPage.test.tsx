import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import AuthLoginPage, { type AuthLoginPageProps } from "./AuthLoginPage";

const signedOut = { allowSignup: false, ssoProvider: null, flash: null };
const open = (data: Partial<Omit<AuthLoginPageProps, "onLogIn">> = {}) => renderPage(AuthLoginPage, { ...signedOut, ...data }, ["onLogIn"]);
const type = (email: string, password: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: password } });
};
const logIn = () => fireEvent.click(screen.getByRole("button", { name: "Log in" }));

describe("AuthLoginPage", () => {
  it("says a blank email and password can't be blank, focuses the email, and sends nothing", () => {
    const page = open();
    logIn();
    expect(screen.getAllByText("can't be blank")).toHaveLength(2);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^Email/ }));
    expect(page.calls("onLogIn")).toHaveLength(0);
  });

  it("says an email without an @ isn't one, in Lightning's words", () => {
    const page = open();
    type("amy", "secret");
    logIn();
    expect(screen.getByText("must have the @ sign and no spaces")).toBeTruthy();
    expect(page.calls("onLogIn")).toHaveLength(0);
  });

  it("sends the email and password, and shows a refusal at the top of the card", async () => {
    const page = open();
    type("amy@openfn.org", "wrong");
    logIn();
    expect(page.calls("onLogIn")).toEqual([[{ email: "amy@openfn.org", password: "wrong" }]]);
    await page.reject("onLogIn", new Error("Invalid email or password"));
    expect(screen.getByText("Invalid email or password")).toBeTruthy();
  });

  it("shows a message a redirect carried, until a refused sign-in replaces it", async () => {
    const page = open({ flash: { tone: "info", message: "Logged out successfully." } });
    expect(screen.getByRole("status").textContent).toContain("Logged out successfully.");
    type("amy@openfn.org", "wrong");
    logIn();
    await page.reject("onLogIn", new Error("Invalid email or password"));
    expect(screen.getByText("Invalid email or password")).toBeTruthy();
    expect(screen.queryByText("Logged out successfully.")).toBeNull();
    logIn();
    expect(screen.queryByText("Logged out successfully.")).toBeNull();
  });

  it("has no Register link, provider button or Remember me by default", () => {
    open();
    expect(screen.queryByRole("link", { name: "Register" })).toBeNull();
    expect(screen.queryByText(/external provider/)).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Remember me/ })).toBeNull();
  });

  it("shows Register and the provider's button when the instance allows them", () => {
    open({ allowSignup: true, ssoProvider: { name: "Keycloak", handlerUrl: "/authenticate/keycloak" } });
    expect(screen.getByRole("link", { name: "Register" })).toBeTruthy();
    expect(screen.getByText(/external provider/)).toBeTruthy();
  });
});

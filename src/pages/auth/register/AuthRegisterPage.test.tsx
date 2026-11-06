import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import { RequestError } from "@/utils/errors";
import AuthRegisterPage from "./AuthRegisterPage";

const open = () => renderPage(AuthRegisterPage, {}, ["onRegister"]);
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillAll = () => {
  fill(/^First Name/, "Test");
  fill(/^Last Name/, "McTest");
  fill(/^Email/, "not-an-email");
  fill(/^Password/, "short");
  fireEvent.click(screen.getByRole("checkbox", { name: /I accept the terms of service/ }));
};
const register = () => fireEvent.click(screen.getByRole("button", { name: "Register" }));

describe("AuthRegisterPage", () => {
  it("flags blanks and the terms box before registering, focuses the first, and checks nothing the server does", () => {
    const page = open();
    register();
    expect(screen.getAllByText("can't be blank")).toHaveLength(4);
    expect(screen.getByText("Please accept the terms and conditions to register.")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: /I accept the terms of service/ }).getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^First Name/ }));
    expect(page.calls("onRegister")).toHaveLength(0);
  });

  it("sends the five values, format and length unchecked", () => {
    const page = open();
    fillAll();
    register();
    expect(page.calls("onRegister")).toEqual([
      [{ first_name: "Test", last_name: "McTest", email: "not-an-email", password: "short", terms_accepted: true }],
    ]);
  });

  it.each([
    ["email", /^Email/, "has already been taken"],
    ["terms_accepted", /I accept the terms of service/, "Please accept the terms and conditions to register."],
  ])("shows the host's error on %s on its field", async (field, label, words) => {
    const page = open();
    fillAll();
    register();
    await page.reject("onRegister", new RequestError("The request body is not valid.", { fieldErrors: { [field]: [words] } }));
    expect(screen.getByLabelText(label).getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(screen.getByLabelText(label));
    expect(screen.getByText(words)).toBeTruthy();
  });
});

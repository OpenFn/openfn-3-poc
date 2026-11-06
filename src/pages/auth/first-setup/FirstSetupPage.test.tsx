import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import { RequestError } from "@/utils/errors";
import FirstSetupPage from "./FirstSetupPage";

const open = () => renderPage(FirstSetupPage, {}, ["onSave"]);
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillAll = (password = "1234567890ab", confirmation = password) => {
  fill(/^First name/, "Test");
  fill(/^Last name/, "McTest");
  fill(/^Email/, "foo@example.com");
  fill(/^Password$/, password);
  fill(/^Password confirmation/, confirmation);
};
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));

describe("FirstSetupPage", () => {
  it("flags blanks and a mismatched confirmation before saving, and nothing the server checks", () => {
    const page = open();
    save();
    expect(screen.getAllByText("can't be blank")).toHaveLength(4);
    fillAll("short", "other");
    fill(/^Email/, "not-an-email");
    save();
    expect(screen.getByText("does not match confirmation")).toBeTruthy();
    expect(screen.queryByText("can't be blank")).toBeNull();
    expect(page.calls("onSave")).toHaveLength(0);
  });

  it("saves the five values, format and length unchecked", () => {
    const page = open();
    fillAll("short");
    fill(/^Email/, "not-an-email");
    save();
    expect(page.calls("onSave")).toEqual([
      [{ first_name: "Test", last_name: "McTest", email: "not-an-email", password: "short", passwordConfirmation: "short" }],
    ]);
  });

  it("shows the host's field errors on their fields", async () => {
    const page = open();
    fillAll();
    save();
    await page.reject("onSave", new RequestError("The request body is not valid.", { fieldErrors: { email: ["has already been taken"] } }));
    expect(screen.getByLabelText(/^Email/).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("has already been taken")).toBeTruthy();
  });
});

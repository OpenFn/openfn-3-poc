import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AuthLoginPage from "./AuthLoginPage";

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/users/log_in"]}>
      <Routes>
        <Route path="/users/log_in" element={<AuthLoginPage />} />
        <Route path="/projects" element={<p>Projects</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthLoginPage", () => {
  it("says a blank email and password can't be blank, focuses the email, and stays on the page", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    const email = screen.getByRole("textbox", { name: /^Email/ });
    expect(screen.getAllByText("can't be blank")).toHaveLength(2);
    expect(document.activeElement).toBe(email);
    expect(screen.queryByText("Projects")).toBeNull();
  });

  it("says an email without an @ isn't one, in Lightning's words", () => {
    renderPage();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "amy" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("must have the @ sign and no spaces")).toBeTruthy();
    expect(screen.queryByText("Projects")).toBeNull();
  });

  it("asks for the password too", () => {
    renderPage();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "amy@openfn.org" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("can't be blank")).toBeTruthy();
    expect(screen.queryByText("Projects")).toBeNull();
  });

  it("logs in once the email and password are filled in", () => {
    renderPage();
    fireEvent.change(screen.getByRole("textbox", { name: /^Email/ }), { target: { value: "amy@openfn.org" } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "welcome12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(screen.getByText("Projects")).toBeTruthy();
  });
});

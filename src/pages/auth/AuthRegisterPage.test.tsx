import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AuthRegisterPage from "./AuthRegisterPage";

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/users/register?signup=1"]}>
      <Routes>
        <Route path="/users/register" element={<AuthRegisterPage />} />
        <Route path="/projects" element={<p>Projects</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthRegisterPage", () => {
  it("shows Lightning's errors for blank fields and unaccepted terms, and focuses the first", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getAllByText("can't be blank")).toHaveLength(4);
    expect(screen.getByText("Please accept the terms and conditions to register.")).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^First Name/ }));
    expect(screen.queryByText("Projects")).toBeNull();
  });
});

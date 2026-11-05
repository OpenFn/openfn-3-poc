import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import UserSettings from "./UserSettings.query";

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <ReactRouterAdapter>
        <Routes>
          <Route element={<UserSettings />}>
            <Route path="*" element={<p>The section</p>} />
          </Route>
        </Routes>
      </ReactRouterAdapter>
    </MemoryRouter>
  );
}

const marked = () => within(screen.getByRole("navigation", { name: "User settings sections" })).getByRole("link", { current: "page" }).textContent;

describe("UserSettings", () => {
  it("frames the page under the menu", () => {
    renderAt("/credentials");
    screen.getByRole("heading", { level: 1, name: "User settings" });
    screen.getByText("The section");
    expect(marked()).toBe("Credentials");
  });

  it("marks the deepest section the URL is in", () => {
    renderAt("/profile/tokens/abc/delete");
    expect(marked()).toBe("API tokens");
  });

  it("marks Profile for the account's own deletion page", () => {
    renderAt("/profile/u1/delete");
    expect(marked()).toBe("Profile");
  });
});

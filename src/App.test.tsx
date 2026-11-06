import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "./api/ApiProvider";
import { resetFakeApi } from "./api/testing";
import App from "./App";
import { ToastProvider } from "./components/primitives/Toast";
import { ReactRouterAdapter } from "./routing/ReactRouterAdapter";

const wait = { timeout: 3000 };

function renderAt(path: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("logs out to the log in page, saying so", async () => {
    renderAt("/users/log_out");
    expect((await screen.findByText("Logged out successfully.", {}, wait)).closest('[role="status"]')).toBeTruthy();
    expect(screen.getByRole("button", { name: "Log in" })).toBeTruthy();
  });

  it("opens the projects list for the signed-in user", async () => {
    renderAt("/projects");
    expect(await screen.findByRole("heading", { name: "Projects" }, wait)).toBeTruthy();
  });
});

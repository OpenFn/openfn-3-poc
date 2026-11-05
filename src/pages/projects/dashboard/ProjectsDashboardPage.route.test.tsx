import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { projectsOverviewFor } from "@/mock-data/dashboard-stats";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import ProjectsDashboardPageRoute from "./ProjectsDashboardPage.route";

const wait = { timeout: 3000 };

function renderRoute() {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/projects"]}>
            <ReactRouterAdapter>
              <Routes>
                <Route path="/projects" element={<ProjectsDashboardPageRoute />} />
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

describe("ProjectsDashboardPageRoute", () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer; Testing Library moves the fake clock on while it waits.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the projects with their counts from the server", async () => {
    renderRoute();
    const expected = projectsOverviewFor(session.user.id);
    const table = await screen.findByRole("table", {}, wait);
    // A header row, then one row per project.
    expect(within(table).getAllByRole("row")).toHaveLength(expected.length + 1);
    const first = expected[0]!;
    expect(within(table).getByText(first.name).closest("tr")!.textContent).toContain(String(first.workflowsCount));
  });

  it("shows the server's message in the table's place when the list fails to load", async () => {
    failNext("GET /api/projects", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderRoute();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.queryByText("No projects found.")).toBeNull();
  });
});

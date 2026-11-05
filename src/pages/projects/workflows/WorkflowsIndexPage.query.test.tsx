import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { failNext, resetFakeApi } from "@/api/testing";
import { workflowStatsFor } from "@/mock-data/dashboard-stats";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import ProjectGate from "@/components/shell/ProjectGate.query";
import WorkflowsIndexPageQuery from "./WorkflowsIndexPage.query";

const wait = { timeout: 3000 };
const project = projects[0]!;

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderQuery() {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <MemoryRouter initialEntries={[`/projects/${project.id}/w`]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/projects/:projectId" element={<ProjectGate />}>
                <Route path="w" element={<><WorkflowsIndexPageQuery /><Search /></>} />
              </Route>
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ApiProvider>
    </SessionProvider>
  );
}

const names = () => within(screen.getByRole("table")).getAllByRole("link").map((a) => a.textContent);

describe("WorkflowsIndexPageQuery", () => {
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

  it("loads the project's workflows by name, and re-sorts through the URL and the server", async () => {
    renderQuery();
    await screen.findByRole("table", {}, wait);
    const byName = workflowStatsFor(project.id).map((s) => s.workflow.name).sort((a, b) => a.localeCompare(b));
    expect(names()).toEqual(byName);

    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(screen.getByTestId("search").textContent).toBe("?sort=name&dir=desc");
    await waitFor(() => expect(names()).toEqual([...byName].reverse()), wait);
  });

  it("turns Create on from the project's permissions", async () => {
    renderQuery();
    const create = await screen.findByRole("link", { name: "Create new workflow" }, wait);
    expect(create.getAttribute("href")).toBe(`/projects/${project.id}/w/new`);
  });

  it("shows the server's message when the list fails to load", async () => {
    failNext(`GET /api/projects/:id/workflows`, { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderQuery();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
  });
});

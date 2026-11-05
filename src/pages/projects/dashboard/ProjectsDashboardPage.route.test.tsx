import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
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

  async function createProject(name: string) {
    fireEvent.click(await screen.findByRole("button", { name: "Create project" }, wait));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: name } });
    fireEvent.submit(document.getElementById("project-form")!);
  }

  it("creates a project on the server, then the list reloads with it", async () => {
    renderRoute();
    const before = within(await screen.findByRole("table", {}, wait)).getAllByRole("row").length;
    await createProject("Malaria Programme");
    expect(await screen.findByText("Project created successfully", {}, wait)).toBeTruthy();
    await waitFor(() => expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(before + 1), wait);
    expect(screen.getByText("malaria-programme").closest("tr")!.textContent).toContain("Owner");
  });

  it("shows the server's field error on the Name field and keeps the modal open", async () => {
    failNext("PUT /api/projects/:id", {
      status: 422,
      code: "invalid",
      errors: [{ code: "format", detail: "has invalid format", pointer: "#/name" }],
    });
    renderRoute();
    await createProject("Malaria Programme");
    expect(await screen.findByText("has invalid format", {}, wait)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});

describe("the fake GET /api/projects", () => {
  beforeEach(() => resetFakeApi());

  it("pages like api/conventions.md, with absolute links that keep the query", async () => {
    const page = await request<{ data: unknown[]; links: Record<string, string | null> }>("GET", "/api/projects?include=stats&page_size=1");
    expect(page.data).toHaveLength(1);
    expect(page.links["prev"]).toBeNull();
    const next = new URL(page.links["next"]!);
    expect(next.pathname).toBe("/api/projects");
    expect(Object.fromEntries(next.searchParams)).toEqual({ include: "stats", page: "2", page_size: "1" });
  });
});

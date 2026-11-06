import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { failNext, resetFakeApi } from "@/api/testing";
import ProjectGate from "@/components/shell/ProjectGate.query";
import { dataclips } from "@/mock-data/history";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import { editors } from "@/test/monaco";
import { formatRelative } from "@/utils/format";
import DataclipShowPageQuery from "./DataclipShowPage.query";

const wait = { timeout: 3000 };
const openhie = projects[0]!;
const sandbox = projects.find((p) => p.parentId === openhie.id)!;

function renderQuery(dataclipId: string, projectId = openhie.id) {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <MemoryRouter initialEntries={[`/projects/${projectId}/dataclips/${dataclipId}/show`]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/projects/:projectId" element={<ProjectGate />}>
                <Route path="dataclips/:dataclipId/show" element={<DataclipShowPageQuery />} />
              </Route>
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ApiProvider>
    </SessionProvider>
  );
}

describe("DataclipShowPageQuery", () => {
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

  it("loads the dataclip's details and its formatted body, with a copy button", async () => {
    renderQuery("dc-7f3a92");
    expect(await screen.findByRole("heading", { level: 1, name: "Dataclip dc-7f3a9" }, wait)).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Dataclip details" })).toBeTruthy();
    for (const label of ["ID", "Type", "Created", "Updated"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("dc-7f3a92")).toBeTruthy();
    expect(screen.getByText("step_result")).toBeTruthy();
    expect(screen.queryByText("Name")).toBeNull();
    expect(screen.queryByText("Wiped")).toBeNull();
    expect(editors.at(-1)!.getModel().getValue()).toBe(JSON.stringify(dataclips.find((d) => d.id === "dc-7f3a92")!.body, null, 2));
    expect(screen.getByRole("button", { name: "Copy to clipboard" })).toBeTruthy();
  });

  it("shows a saved input's name", async () => {
    renderQuery("dc-saved-1");
    expect(await screen.findByText("Name", {}, wait)).toBeTruthy();
    expect(screen.getByText("Sample registration")).toBeTruthy();
  });

  it("shows when a wiped dataclip was wiped, and the retention notice instead of the body", async () => {
    renderQuery("dc-wiped-openhie");
    expect(await screen.findByText("Wiped", {}, wait)).toBeTruthy();
    expect(screen.getByText(formatRelative("2026-10-20T00:00:00Z"))).toBeTruthy();
    expect(screen.getByText("No data available")).toBeTruthy();
    expect(screen.getByText("This dataclip's data has been wiped in accordance with the project's data retention policy.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy to clipboard" })).toBeNull();
  });

  it("says No Access for a dataclip the server doesn't hold", async () => {
    renderQuery("dc-nope");
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Dataclip" })).toBeTruthy();
  });

  it("says Not Found for a dataclip from another project the person can open", async () => {
    renderQuery("dc-7f3a92", sandbox.id);
    expect(await screen.findByRole("heading", { name: "Not Found" }, wait)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Dataclip" })).toBeTruthy();
    expect(screen.queryByText("dc-7f3a92")).toBeNull();
  });

  it("shows the server's message when the dataclip can't be loaded", async () => {
    failNext("GET /api/dataclips/:id", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderQuery("dc-7f3a92");
    expect((await screen.findByRole("alert", {}, wait)).textContent).toBe("Something went wrong in Lightning.");
    expect(screen.queryByText("Dataclip details")).toBeNull();
  });

  it("links the breadcrumb back to the project's History", async () => {
    renderQuery("dc-7f3a92");
    const history = await screen.findByRole("link", { name: "History" }, wait);
    expect(history.getAttribute("href")).toBe(`/projects/${openhie.id}/history`);
  });
});

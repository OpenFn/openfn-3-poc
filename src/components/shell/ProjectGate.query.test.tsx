import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { useCurrentProject } from "@/api/projects";
import { failNext, resetFakeApi } from "@/api/testing";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import ProjectGate from "./ProjectGate.query";

const wait = { timeout: 3000 };
const member = projects.find((p) => p.members.some((m) => m.userId === session.user.id))!;

/** A page under the gate, reading the project the way the sweep's .query files will. */
function Child() {
  const { projectId = "" } = useParams();
  return <p>Inside {useCurrentProject(projectId).name}</p>;
}

function renderAt(projectId: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/w`]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectGate />}>
            <Route path="w" element={<Child />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </ApiProvider>
  );
}

describe("ProjectGate", () => {
  beforeEach(() => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders the page only once the project has loaded, and the page reads it from the cache", async () => {
    renderAt(member.id);
    expect(screen.queryByText(/Inside/)).toBeNull();
    expect(await screen.findByText(`Inside ${member.name}`, {}, wait)).toBeTruthy();
  });

  it("a project you can't open shows Lightning's nav error, not the page", async () => {
    renderAt(crypto.randomUUID());
    // Only a superuser hears that a project doesn't exist (api/projects.md).
    const title = session.user.role === "superuser" ? "Not Found" : "No Access";
    // The page h1 is gone, so the refusal stands in for it, inside a status so it is announced.
    const heading = await screen.findByRole("heading", { level: 1, name: title }, wait);
    expect(heading.closest("[role=status]")).toBeTruthy();
    expect(screen.queryByText(/Inside/)).toBeNull();
  });

  it("any other failure shows the server's message", async () => {
    failNext("GET /api/projects/:id", { status: 500, code: "internal", detail: "Lightning fell over." });
    renderAt(member.id);
    expect(await screen.findByText("Lightning fell over.", {}, wait)).toBeTruthy();
  });
});

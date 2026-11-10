import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { useCurrentProject } from "@/api/projects";
import { request } from "@/api/client";
import { FAKE_MFA_CODE, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import { TextInput } from "@/components/primitives/Inputs";
import ProjectGate from "./ProjectGate.query";

const wait = { timeout: 3000 };
const members = projects.filter((p) => !p.requiresMfa && p.members.some((m) => m.userId === session.user.id));
const member = members[0]!;
const otherMember = members[1]!;
// A project that requires MFA, with the first fixture user (no MFA) as a member.
const mfaProject = projects.find((p) => p.requiresMfa && p.members.some((m) => m.userId === session.user.id))!;

/** A page under the gate, reading the project the way the sweep's .query files will. */
function Child() {
  const { projectId = "" } = useParams();
  return <p>Inside {useCurrentProject(projectId).name}</p>;
}

/** A page holding state of its own, seeded from its project, as a form is. */
function Draft() {
  const { projectId = "" } = useParams();
  const project = useCurrentProject(projectId);
  return (
    <>
      <TextInput label="Name" defaultValue={project.name} />
      <Link to={`/projects/${member.id}/w`}>First</Link>
      <Link to={`/projects/${otherMember.id}/w`}>Second</Link>
    </>
  );
}

function renderAt(projectId: string, page = <Child />) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/w`]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectGate />}>
            <Route path="w" element={page} />
          </Route>
          <Route path="/mfa_required" element={<p>Set up MFA</p>} />
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

  it("switching project starts the page afresh, even when the new project is already loaded", async () => {
    renderAt(otherMember.id, <Draft />);
    const name = () => screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
    expect((await screen.findByRole<HTMLInputElement>("textbox", { name: "Name" }, wait)).value).toBe(otherMember.name);
    fireEvent.click(screen.getByRole("link", { name: "First" }));
    expect((await screen.findByDisplayValue(member.name, {}, wait))).toBeTruthy();
    fireEvent.change(name(), { target: { value: "Typed for the first project" } });
    // Back to a project still in the cache: no loading state, so only a key makes the page start again.
    fireEvent.click(screen.getByRole("link", { name: "Second" }));
    expect(name().value).toBe(otherMember.name);
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

  it("a member without MFA on a project that requires it is sent to set it up, not told No Access", async () => {
    renderAt(mfaProject.id);
    expect(await screen.findByText("Set up MFA", {}, wait)).toBeTruthy();
    expect(screen.queryByText("No Access")).toBeNull();
  });

  it("a non-member of a project that requires MFA still gets No Access, not sent to set it up", async () => {
    await request("POST", "/api/session", { email: "viewer@openfn.org", password: FAKE_PASSWORD });
    expect(mfaProject.members.some((m) => m.userId === "user-vikram")).toBe(false);
    renderAt(mfaProject.id);
    expect(await screen.findByRole("heading", { level: 1, name: "No Access" }, wait)).toBeTruthy();
    expect(screen.queryByText("Set up MFA")).toBeNull();
  });

  it("a member with MFA opens a project that requires it", async () => {
    await request("POST", "/api/session", { email: "super@openfn.org", password: FAKE_PASSWORD }).catch(() => undefined);
    await request("POST", "/api/session", { mfa_code: FAKE_MFA_CODE });
    renderAt(mfaProject.id);
    expect(await screen.findByText(`Inside ${mfaProject.name}`, {}, wait)).toBeTruthy();
  });
});

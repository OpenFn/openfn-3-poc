import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_MFA_CODE, FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import ProjectGate from "@/components/shell/ProjectGate.query";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import { isDisabled } from "@/test/disabled";
import { pickOption } from "@/test/select";
import { tooltipOf } from "@/test/tooltip";
import SandboxesIndexPageQuery from "./SandboxesIndexPage.query";

// One more sandbox of openhie-project, whose owner Sizwe is in nothing else in its workspace. Amy and Vikram view it.
vi.mock("@/mock-data/projects", async (original) => {
  const { projects, findProject } = await original<typeof import("@/mock-data/projects")>();
  const fhir = projects.find((p) => p.name === "fhir-mapping-v2")!;
  const pilot = {
    ...fhir,
    id: "7d3e9a10-2b4c-4d5e-8f60-718293a4b5c6",
    name: "lab-pilot",
    color: "#E33D63",
    members: [
      { userId: "user-sizwe", role: "owner" as const, failureAlert: false, digest: "never" as const },
      { userId: "user-amy", role: "viewer" as const, failureAlert: false, digest: "never" as const },
      { userId: "user-vikram", role: "viewer" as const, failureAlert: false, digest: "never" as const },
    ],
  };
  return { projects: [...projects, pilot], findProject };
});

const wait = { timeout: 3000 };
const openhie = projects.find((p) => p.name === "openhie-project")!;
const fhir = projects.find((p) => p.name === "fhir-mapping-v2")!;
const pilot = projects.find((p) => p.name === "lab-pilot")!;
const listOf = (id: string) => `/projects/${id}/sandboxes`;

function Where() {
  const { pathname } = useLocation();
  return <output data-testid="where">{pathname}</output>;
}

function renderAt(path: string) {
  const page = (
    <>
      <SandboxesIndexPageQuery />
      <Where />
    </>
  );
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <ToastProvider>
          <MemoryRouter initialEntries={[path]}>
            <ReactRouterAdapter>
              <Routes>
                <Route path="/projects/:projectId" element={<ProjectGate />}>
                  <Route path="sandboxes" element={page} />
                  <Route path="sandboxes/new" element={page} />
                  <Route path="sandboxes/:sandboxId/edit" element={page} />
                  <Route path="w" element={<Where />} />
                </Route>
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

const where = () => screen.getByTestId("where").textContent;
const dialog = () => screen.getByRole("dialog");
const section = (title: string) => screen.getByRole("heading", { name: title }).closest("section")!;
// The section's heading first, then its cards'.
const namesIn = (title: string) => within(section(title)).getAllByRole("heading").slice(1).map((h) => h.textContent);
const cardOf = (name: string) => screen.getByRole("heading", { name }).closest("[data-ui=card]") as HTMLElement;
const loaded = () => screen.findByRole("heading", { name: "Selected" }, wait);
const choose = async (name: string, item: string) => {
  await userEvent.click(within(cardOf(name)).getByRole("button", { name: `Actions for ${name}` }));
  return screen.getByRole("menuitem", { name: new RegExp(`^${item}`) });
};
const signInAs = async (email: string) => {
  await request("DELETE", "/api/session");
  await request("POST", "/api/session", { email, password: FAKE_PASSWORD }).catch(() => undefined);
};

describe("SandboxesIndexPageQuery", () => {
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

  it("loads the workspace: the project under Selected, its sandboxes under Active, a scheduled one under Scheduled for deletion", async () => {
    renderAt(listOf(openhie.id));
    await loaded();
    expect(namesIn("Selected")).toEqual(["openhie-project"]);
    expect(namesIn("Active")).toEqual(["fhir-mapping-v2", "lab-pilot"]);
    expect(namesIn("Scheduled for deletion")).toEqual(["old-import-test"]);
    expect(screen.getByRole("link", { name: "New sandbox" })).toBeTruthy();
  });

  it("shows someone in only a sandbox nothing above it, and gives that sandbox no actions", async () => {
    await signInAs("super@openfn.org");
    await request("POST", "/api/session", { mfa_code: FAKE_MFA_CODE });
    renderAt(listOf(pilot.id));
    await loaded();
    expect(namesIn("Selected")).toEqual(["lab-pilot"]);
    expect(section("Active").textContent).toContain("No other sandboxes");
    expect(screen.queryByText("openhie-project")).toBeNull();
    expect(within(cardOf("lab-pilot")).queryByRole("button")).toBeNull();
  });

  it("creates a sandbox and lands on its workflows; a name its parent already has shows under Name", async () => {
    renderAt(`${listOf(openhie.id)}/new`);
    const name = await screen.findByLabelText(/^Name/, {}, wait);
    fireEvent.change(name, { target: { value: "fhir-mapping-v2" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create sandbox" }));
    const error = await within(dialog()).findByText("Sandbox name already exists", {}, wait);
    expect(name.getAttribute("aria-describedby")).toContain(error.id);

    fireEvent.change(name, { target: { value: "Trial run" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create sandbox" }));
    expect(await screen.findByText("Created a sandbox from openhie-project.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(where()).toMatch(/^\/projects\/[0-9a-f-]{36}\/w$/), wait);
    const id = where()!.split("/")[2]!;
    const created = await request<{ data: { attributes: { name: string; parent_id: string } } }>("GET", `/api/projects/${id}`);
    expect(created.data.attributes).toMatchObject({ name: "trial-run", parent_id: openhie.id });
  });

  it("renames a sandbox: a sibling's name is refused under Name, a new one saves and goes back to the list", async () => {
    renderAt(`${listOf(openhie.id)}/${fhir.id}/edit`);
    const name = await screen.findByLabelText(/^Name/, {}, wait);
    fireEvent.change(name, { target: { value: "lab-pilot" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    expect(await within(dialog()).findByText("Sandbox name already exists", {}, wait)).toBeTruthy();

    fireEvent.change(name, { target: { value: "fhir-r4" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Sandbox updated", {}, wait)).toBeTruthy();
    expect(where()).toBe(listOf(openhie.id));
    await waitFor(() => expect(namesIn("Active")).toEqual(["fhir-r4", "lab-pilot"]), wait);
  });

  it("deletes a sandbox, which moves it to Scheduled for deletion", async () => {
    renderAt(listOf(openhie.id));
    await loaded();
    await userEvent.click(await choose("lab-pilot", "Delete"));
    fireEvent.change(within(dialog()).getByLabelText(/Sandbox name/), { target: { value: "lab-pilot" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete sandbox" }));
    expect(await screen.findByText("Sandbox lab-pilot scheduled for deletion.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(namesIn("Scheduled for deletion")).toEqual(["lab-pilot", "old-import-test"]), wait);
  });

  it("deleting the sandbox you're in takes you to its parent's sandboxes", async () => {
    renderAt(listOf(fhir.id));
    await loaded();
    await userEvent.click(await choose("fhir-mapping-v2", "Delete"));
    expect(dialog().textContent).toContain("you'll be redirected to openhie-project");
    fireEvent.change(within(dialog()).getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping-v2" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete sandbox" }));
    expect(await screen.findByText("Sandbox fhir-mapping-v2 scheduled for deletion.", {}, wait)).toBeTruthy();
    expect(where()).toBe(listOf(openhie.id));
    await waitFor(() => expect(namesIn("Scheduled for deletion")).toEqual(["fhir-mapping-v2", "old-import-test"]), wait);
  });

  it("restores a scheduled sandbox; a refused restore is an error toast that stays", async () => {
    renderAt(listOf(openhie.id));
    await loaded();
    failNext("DELETE /api/projects/:id/scheduled_deletion", { status: 403, code: "forbidden", detail: "You are not allowed to do that." });
    fireEvent.click(within(cardOf("old-import-test")).getByRole("button", { name: "Restore old-import-test" }));
    expect((await screen.findByRole("alert", {}, wait)).textContent).toContain("You are not allowed to do that.");

    fireEvent.click(within(cardOf("old-import-test")).getByRole("button", { name: "Restore old-import-test" }));
    expect(await screen.findByText("Cancelled deletion of sandbox old-import-test.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(namesIn("Active")).toEqual(["fhir-mapping-v2", "lab-pilot", "old-import-test"]), wait);
  });

  it("merges: previews the parent, previews again for a new target, shows that target's refusal, then lands on the parent's workflows", async () => {
    renderAt(listOf(openhie.id));
    await loaded();
    await userEvent.click(await choose("fhir-mapping-v2", "Merge"));
    const merge = () => document.getElementById("merge-sandbox-submit")!;
    await within(dialog()).findByLabelText(/^OpenHIE Workflow/, {}, wait);
    expect(dialog().textContent).toContain("Changed in openhie-project too");
    expect((screen.getByLabelText(/^Facility registry sync/) as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByLabelText("Referral follow-ups")).toBeNull();

    // Amy only views lab-pilot.
    await pickOption(document.getElementById("merge-target-select")!, "lab-pilot");
    // Unchanged against the parent, new in lab-pilot.
    await within(dialog()).findByLabelText(/^Referral follow-ups/, {}, wait);
    expect(screen.queryByLabelText(/^Facility registry sync/)).toBeNull();
    expect(dialog().textContent).not.toContain("too");
    fireEvent.click(merge());
    expect(await within(dialog()).findByText("You are not authorized to merge into this project", {}, wait)).toBeTruthy();

    await pickOption(document.getElementById("merge-target-select")!, "openhie-project");
    await within(dialog()).findByLabelText(/^Facility registry sync/, {}, wait);
    fireEvent.click(merge());
    expect(await screen.findByText("Merged fhir-mapping-v2 into openhie-project. Sandbox scheduled for deletion.", {}, wait)).toBeTruthy();
    expect(where()).toBe(`/projects/${openhie.id}/w`);
  });

  it("for a viewer, greys New sandbox and the menu, and sends /new back to the list", async () => {
    await signInAs("viewer@openfn.org");
    renderAt(`${listOf(openhie.id)}/new`);
    await loaded();
    expect(where()).toBe(listOf(openhie.id));
    expect(screen.queryByRole("dialog")).toBeNull();
    const create = screen.getByRole("button", { name: "New sandbox" });
    expect(isDisabled(create)).toBe(true);
    expect(await tooltipOf(create)).toBe("You are not authorized to create sandboxes in this workspace");
    await choose("lab-pilot", "Edit");
    expect(screen.getAllByRole("menuitem").every(isDisabled)).toBe(true);
  });

  it("sends an edit of a sandbox that isn't listed back to the list", async () => {
    renderAt(`${listOf(openhie.id)}/5b2e8f41-6c3d-4e7a-9b1f-2d4c6e8a0b13/edit`);
    await loaded();
    await waitFor(() => expect(where()).toBe(listOf(openhie.id)), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

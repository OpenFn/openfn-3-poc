import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { stepUp } from "@/api/session";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { projects } from "@/mock-data/projects";
import { users } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { pickOption } from "@/test/select";
import AdminProjectsPageQuery from "./AdminProjectsPage.query";

const wait = { timeout: 3000 };

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

function renderAt(path = "/settings/projects") {
  const page = (
    <>
      <AdminProjectsPageQuery />
      <Where />
    </>
  );
  render(
    <ApiProvider retry={false}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/settings/projects" element={page} />
              <Route path="/settings/projects/new" element={page} />
              <Route path="/settings/projects/:projectId" element={page} />
              <Route path="/settings/projects/:projectId/delete" element={page} />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

const where = () => screen.getByTestId("where").textContent;
const names = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.firstElementChild?.textContent);
const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const dialog = () => screen.getByRole("dialog");
const roleOf = (name: string) => within(dialog()).getByRole("button", { name: new RegExp(`${name}'s role`) });
const signInAs = async (email: string) => {
  await request("DELETE", "/api/session");
  await request("POST", "/api/session", { email, password: FAKE_PASSWORD });
};

const [openhie, dhis2] = projects;
// The fake adds one project with no owner and no members to the fixtures.
// The fake's own: a project with no members, and a sandbox scheduled for deletion.
const everyProject = [...projects, { name: "legacy-imports", insertedAt: "2023-11-20T09:00:00Z" }, { name: "old-import-test", insertedAt: "2026-01-01T00:00:00Z" }];
const inOrder = (by: (p: (typeof everyProject)[number]) => string, desc = false) =>
  [...everyProject].sort((a, b) => (desc ? -1 : 1) * by(a).localeCompare(by(b))).map((p) => expect.stringContaining(p.name));
const amy = users.find((u) => u.id === "user-amy")!;
const esther = users.find((u) => u.id === "user-esther")!;
const vikram = users.find((u) => u.id === "user-vikram")!;

async function fillNewProject(name: string) {
  await screen.findByRole("button", { name: /Amy Admin's role/ }, wait);
  fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: name } });
}
const create = () => fireEvent.click(within(dialog()).getByRole("button", { name: "Create project" }));

// Each case makes several requests to a fake that waits 300ms before each answer.
describe("AdminProjectsPageQuery", { timeout: 10_000 }, () => {
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

  it("loads every project on the instance by name, with its owner and member count, or No owner", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(names()).toEqual(inOrder((p) => p.name));
    expect(rowOf(openhie!.name).textContent).toContain("Amy Admin");
    expect(within(rowOf(openhie!.name)).getByText(String(openhie!.members.length))).toBeTruthy();
    expect(rowOf("legacy-imports").textContent).toContain("No owner");
    // A sandbox is labelled with its parent.
    expect(screen.getByText(`${openhie!.name}/fhir-mapping-v2`)).toBeTruthy();
  });

  it("searches through ?q= on the server, back to the first page, and sorts by Created, newest first, through the URL", async () => {
    renderAt("/settings/projects?page=2");
    await screen.findByRole("table", {}, wait);
    fireEvent.change(screen.getByRole("textbox", { name: "Filter projects" }), { target: { value: "esther" } });
    await waitFor(() => expect(where()).toBe("/settings/projects?q=esther"), wait);
    await waitFor(() => expect(names()).toEqual([expect.stringContaining(dhis2!.name)]), wait);

    fireEvent.change(screen.getByRole("textbox", { name: "Filter projects" }), { target: { value: "" } });
    await waitFor(() => expect(names()).toHaveLength(everyProject.length), wait);
    fireEvent.click(screen.getByRole("button", { name: /Created/ }));
    fireEvent.click(screen.getByRole("button", { name: /Created/ }));
    expect(where()).toBe("/settings/projects?sort=inserted_at&dir=desc");
    await waitFor(() => expect(names()).toEqual(inOrder((p) => p.insertedAt, true)), wait);
  });

  it("creates a project with a description, an owner and a member, without the creator in it", async () => {
    renderAt("/settings/projects/new?sort=name");
    await fillNewProject("Malaria Programme");
    fireEvent.change(within(dialog()).getByLabelText("Description"), { target: { value: "Case reports" } });
    await pickOption(roleOf("Esther Editor"), "Owner");
    await pickOption(roleOf("Vikram Viewer"), "Viewer");
    create();
    expect(await screen.findByText("Project created successfully", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(where()).toBe("/settings/projects?sort=name");
    expect(rowOf("malaria-programme").textContent).toContain("Esther Editor");
    expect(within(rowOf("malaria-programme")).getByText("2")).toBeTruthy();
    // Amy made it, but isn't in it, so she can't open it.
    const id = rowOf("malaria-programme").id.replace("project-row-", "");
    await expect(request("GET", `/api/projects/${id}`)).rejects.toMatchObject({ code: "forbidden" });
    // The description was saved: the server's search finds it.
    const found = await request<{ data: { id: string }[] }>("GET", "/api/projects?scope=all&q=case%20reports");
    expect(found.data.map((p) => p.id)).toEqual([id]);
  });

  it("leaves a disabled user out of the member grid", async () => {
    // Vikram schedules his own deletion, which disables him.
    await signInAs(vikram.email);
    await stepUp({ password: FAKE_PASSWORD });
    await request("DELETE", `/api/users/${vikram.id}`);
    await signInAs(amy.email);
    renderAt("/settings/projects/new");
    await screen.findByRole("button", { name: /Amy Admin's role/ }, wait);
    expect(within(dialog()).queryByText("Vikram Viewer")).toBeNull();
    expect(within(dialog()).getByText("Esther Editor")).toBeTruthy();
  });

  it("shows a name the server refuses under the Name field", async () => {
    renderAt("/settings/projects/new");
    await fillNewProject("my_project");
    await pickOption(roleOf("Esther Editor"), "Owner");
    create();
    const error = await within(dialog()).findByText("has invalid format", {}, wait);
    expect(within(dialog()).getByLabelText(/Name/).getAttribute("aria-describedby")).toContain(error.id);
  });

  it("shows the server's refusal of two owners under Members", async () => {
    renderAt("/settings/projects/new");
    await fillNewProject("two-owners");
    await pickOption(roleOf("Amy Admin"), "Owner");
    await pickOption(roleOf("Esther Editor"), "Owner");
    create();
    const members = within(screen.getByRole("group", { name: /Members/ }));
    expect(await members.findByText("A project can have only one owner.", {}, wait)).toBeTruthy();
    expect(screen.queryByText("Project created successfully")).toBeNull();
  });

  it("shows a plan limit refusal in the modal and keeps it open", async () => {
    failNext("PUT /api/projects/:id", {
      status: 402,
      code: "exceeds_limit",
      detail: "Your plan has no seat for another member.",
      errors: [{ code: "exceeds_limit", detail: "no seat", pointer: "#/members" }],
    });
    renderAt("/settings/projects/new");
    await fillNewProject("one-too-many");
    await pickOption(roleOf("Esther Editor"), "Owner");
    create();
    const alert = await within(dialog()).findByRole("alert", {}, wait);
    expect(alert.textContent).toContain("The project wasn't saved");
    expect(alert.textContent).toContain("Your plan has no seat for another member.");
  });

  it("schedules a deletion through /:id/delete once the name is typed, then cancels it from the row", async () => {
    renderAt(`/settings/projects/${dhis2!.id}/delete?q=dhis`);
    await screen.findByRole("dialog", {}, wait);
    expect(dialog().textContent).toContain("7 day(s) from today");
    fireEvent.change(within(dialog()).getByLabelText(/Project name/), { target: { value: dhis2!.name } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete project" }));
    expect(await screen.findByText("Project scheduled for deletion", {}, wait)).toBeTruthy();
    expect(where()).toBe("/settings/projects?q=dhis");
    expect(rowOf(dhis2!.name).textContent).toContain("Deletes");

    fireEvent.click(screen.getByRole("button", { name: `Cancel deletion of ${dhis2!.name}` }));
    expect(await screen.findByText("Project deletion canceled", {}, wait)).toBeTruthy();
    expect(rowOf(dhis2!.name).textContent).not.toContain("Deletes");
  });

  it("shows Delete now disabled in a scheduled project's menu, with why", async () => {
    await request("DELETE", `/api/projects/${dhis2!.id}`);
    renderAt();
    await userEvent.click(await screen.findByRole("button", { name: `More actions for ${dhis2!.name}` }, wait));
    const item = within(screen.getByRole("menu")).getByRole("menuitem", { name: /Delete now/ });
    expect(item.getAttribute("aria-disabled")).toBe("true");
    expect(item.textContent).toContain("Not available in the API yet");
  });

  it.each([
    ["a project's own page", `/settings/projects/${dhis2?.id}?q=x`, false],
    ["the delete dialog of a project not on the loaded page", `/settings/projects/5b2e8f41-0000-4000-8000-000000000000/delete?q=x`, false],
    ["the delete dialog of a project already scheduled", `/settings/projects/${dhis2?.id}/delete?q=x`, true],
  ])("sends %s to the list", async (_case, path, scheduled) => {
    if (scheduled) await request("DELETE", `/api/projects/${dhis2!.id}`);
    renderAt(path);
    await waitFor(() => expect(where()).toBe("/settings/projects?q=x"), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows No Access to someone who isn't a superuser", async () => {
    await signInAs(esther.email);
    renderAt();
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { request } from "@/api/client";
import { ToastProvider } from "@/components/primitives/Toast";
import { collections } from "@/mock-data/project-settings";
import { projects } from "@/mock-data/projects";
import { users } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { pickOption } from "@/test/select";
import AdminCollectionsPageQuery from "./AdminCollectionsPage.query";

const wait = { timeout: 3000 };

function Search() {
  return <output data-testid="search">{useLocation().search}</output>;
}

function renderAt(search = "") {
  render(
    <ApiProvider retry={false}>
      <ToastProvider>
        <MemoryRouter initialEntries={[`/settings/collections${search}`]}>
          <ReactRouterAdapter>
            <Routes>
              <Route
                path="/settings/collections"
                element={
                  <>
                    <AdminCollectionsPageQuery />
                    <Search />
                  </>
                }
              />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

const names = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.firstElementChild?.textContent);
const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const dialog = () => screen.getByRole("dialog");
const nameField = () => within(dialog()).getByLabelText(/Name/);
const projectPicker = () => within(dialog()).getByRole("button", { name: /^Project/ });
const nameOf = (id: string) => projects.find((p) => p.id === id)!.name;

const first = collections[0]!;
const editFirst = () => fireEvent.click(screen.getByRole("button", { name: `Edit ${first.name} in ${nameOf(first.projectId)}` }));
// A sandbox, which the picker labels "parent/sandbox".
const sandbox = projects.find((p) => p.parentId !== null)!;
// A project with none of the fixtures' collections in it yet, to move to.
const other = projects.find((p) => p.parentId === null && !collections.some((c) => c.projectId === p.id))!;

function save(button: string) {
  fireEvent.click(within(dialog()).getByRole("button", { name: button }));
}

describe("AdminCollectionsPageQuery", () => {
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

  it("loads every collection on the instance with its project, by name", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(names()).toEqual(collections.map((c) => c.name).sort((a, b) => a.localeCompare(b)));
    expect(rowOf(first.name).textContent).toContain(nameOf(first.projectId));
  });

  it("sorts by storage on the server through the URL, largest first on a second click", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    fireEvent.click(screen.getByRole("button", { name: /Size/ }));
    expect(screen.getByTestId("search").textContent).toBe("?sort=byte_size_sum&dir=asc");
    // The old rows stay while the new order loads.
    expect(names()).toHaveLength(collections.length);
    const bySize = [...collections].sort((a, b) => a.byteSizeSum - b.byteSizeSum).map((c) => c.name);
    await waitFor(() => expect(names()).toEqual(bySize), wait);
    fireEvent.click(screen.getByRole("button", { name: /Size/ }));
    await waitFor(() => expect(names()).toEqual([...bySize].reverse()), wait);
  });

  it("creates a collection in the chosen project, a sandbox here, then the list reloads with it", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    fireEvent.change(nameField(), { target: { value: "New Visits" } });
    await pickOption(projectPicker(), `${nameOf(sandbox.parentId!)}/${sandbox.name}`);
    save("Create collection");
    expect(await screen.findByText("Collection created successfully", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(rowOf("new-visits").textContent).toContain(sandbox.name);
    expect(rowOf("new-visits").textContent).toContain("0 B");
  });

  it("renames a collection", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    editFirst();
    fireEvent.change(nameField(), { target: { value: "renamed" } });
    save("Save changes");
    expect(await screen.findByText("Collection updated successfully", {}, wait)).toBeTruthy();
    expect(screen.queryByText(first.name)).toBeNull();
    expect(rowOf("renamed").textContent).toContain(nameOf(first.projectId));
  });

  it("moves a collection to another project", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    editFirst();
    await pickOption(projectPicker(), nameOf(other.id));
    save("Save changes");
    expect(await screen.findByText("Collection updated successfully", {}, wait)).toBeTruthy();
    expect(rowOf(first.name).textContent).toContain(other.name);
  });

  it("shows a name the project already has under the Name field, and keeps the modal open", async () => {
    failNext("PUT /api/projects/:project_id/collections/:id", {
      status: 422,
      code: "invalid",
      errors: [{ code: "taken", detail: "A collection with this name already exists", pointer: "#/name" }],
    });
    renderAt();
    await screen.findByRole("table", {}, wait);
    editFirst();
    save("Save changes");
    const error = await screen.findByText("A collection with this name already exists", {}, wait);
    expect(nameField().getAttribute("aria-describedby")).toContain(error.id);
    expect(dialog()).toBeTruthy();
  });

  it("shows a plan limit refusal in the modal and keeps it open", async () => {
    failNext("PUT /api/projects/:project_id/collections/:id", {
      status: 402,
      code: "exceeds_limit",
      detail: "You have reached the limit of collections for this project.",
    });
    renderAt();
    await screen.findByRole("table", {}, wait);
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    fireEvent.change(nameField(), { target: { value: "one-too-many" } });
    await pickOption(projectPicker(), nameOf(other.id));
    save("Create collection");
    expect(await within(dialog()).findByText("You have reached the limit of collections for this project.", {}, wait)).toBeTruthy();
    expect(screen.queryByText("one-too-many", { selector: "td" })).toBeNull();
  });

  it("keeps the list when the projects fail to load, and says so in the create modal", async () => {
    failNext("GET /api/projects", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(names()).toHaveLength(collections.length);
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    expect(within(dialog()).getByText("The projects couldn't be loaded")).toBeTruthy();
    expect(within(dialog()).getByText("Something went wrong in Lightning.")).toBeTruthy();
  });

  it("shows No Access to someone who isn't a superuser", async () => {
    const user = users.find((u) => u.role !== "superuser" && !u.mfaEnabled)!;
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: user.email, password: FAKE_PASSWORD });
    renderAt();
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
  });
});

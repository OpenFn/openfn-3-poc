import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Button from "../../components/primitives/Button";
import { ToastProvider } from "../../components/primitives/Toast";
import { findUser, session } from "../../mock-data/users";
import { sandboxColorPalette } from "../../constants";
import { fixturesUnder, type SandboxFixture } from "../../mock-data/sandboxes";
import SessionProvider from "../../session/SessionProvider";
import SandboxesIndexPageReplica from "./SandboxesIndexPage.replica";
import { isDisabled } from "../../test/disabled";

const ROOT = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";
const FHIR = "8c1d2e3f-4a5b-4c6d-9e7f-0a1b2c3d4e5f";
const OLD = "2b3c4d5e-6f70-4a81-92b3-c4d5e6f70a81";
const wait = { timeout: 3000 };

function Where() {
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="where">{useLocation().pathname}</output>
      <Button onClick={() => navigate(`/projects/${ROOT}/sandboxes`)}>Go to the root</Button>
      <Button onClick={() => navigate(`/projects/${ROOT}/sandboxes/new`)}>Go to new</Button>
    </>
  );
}

function renderAt(path: string, as = session) {
  render(
    <SessionProvider session={as}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            {["", "/new", "/:sandboxId/edit"].map((tail) => (
              <Route key={tail} path={`/projects/:projectId/sandboxes${tail}`} element={<SandboxesIndexPageReplica />} />
            ))}
          </Routes>
          <Where />
        </MemoryRouter>
      </ToastProvider>
    </SessionProvider>
  );
}

const scheduledNames = () =>
  within(document.getElementById("scheduled-for-deletion-section")!)
    .getAllByRole("heading")
    .map((h) => h.textContent)
    .slice(1);

describe("SandboxesIndexPageReplica", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lists every sandbox under the root by name, not by tree (projects.ex list_descendants)", () => {
    const f = (id: string, name: string, parentId: string): SandboxFixture => ({ id, name, color: null, parentId, env: null, scheduledDeletion: null });
    const all = [f("r", "root", ""), f("b", "beta", "r"), f("z", "zulu", "b"), f("a", "alpha", "b"), f("m", "mike", "r")];
    all[0]!.parentId = null;
    expect(fixturesUnder(all, "r").map((x) => x.name)).toEqual(["alpha", "beta", "mike", "zulu"]);
  });

  it("picks a new colour each time the Create form opens", async () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    renderAt(`/projects/${ROOT}/sandboxes/new`);
    expect((screen.getByRole("radio", { name: sandboxColorPalette[0]! }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    random.mockReturnValue(0.99);
    fireEvent.click(screen.getByRole("button", { name: "Go to new" }));
    const last = sandboxColorPalette[sandboxColorPalette.length - 1]!;
    expect(((await screen.findByRole("radio", { name: last })) as HTMLInputElement).checked).toBe(true);
  });

  it("schedules a sandbox with the ones under it, moves the viewer out of it, and Restore brings them all back", async () => {
    renderAt(`/projects/${FHIR}/sandboxes/new`);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Child One" } });
    fireEvent.submit(document.getElementById("sandbox-form")!);
    expect(await screen.findByText("Sandbox created", {}, wait)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`/projects/${FHIR}/sandboxes`));
    expect(screen.getByText("child-one")).toBeTruthy();

    fireEvent.click(document.querySelector(`#delete-sandbox-${FHIR} button`)!);
    fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping-v2" } });
    fireEvent.submit(document.getElementById("confirm-delete-sandbox-form")!);
    expect(await screen.findByText("Sandbox fhir-mapping-v2 scheduled for deletion.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`/projects/${ROOT}/sandboxes`));
    expect(scheduledNames().sort()).toEqual(["child-one", "fhir-mapping-v2", "old-import-test"]);

    fireEvent.click(document.querySelector(`#cancel-deletion-sandbox-${FHIR} button`)!);
    expect(await screen.findByText("Cancelled deletion of sandbox fhir-mapping-v2.", {}, wait)).toBeTruthy();
    expect(scheduledNames()).toEqual(["old-import-test"]);
  }, 10_000);

  it("refuses a name a sibling has, scheduled ones included, on the field", async () => {
    renderAt(`/projects/${ROOT}/sandboxes/new`);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Old Import Test" } });
    fireEvent.submit(document.getElementById("sandbox-form")!);
    expect(await screen.findByText("Sandbox name already exists", {}, wait)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("opens the edit form with the stored name", () => {
    renderAt(`/projects/${ROOT}/sandboxes/${FHIR}/edit`);
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe("fhir-mapping-v2");
  });

  it("opens no edit form for a sandbox scheduled for deletion, and still shows the list", () => {
    renderAt(`/projects/${ROOT}/sandboxes/${OLD}/edit`);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scheduledNames()).toEqual(["old-import-test"]);
  });

  it("leaves the viewer where they are when they delete a sandbox they aren't in", async () => {
    renderAt(`/projects/${FHIR}/sandboxes/new`);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Child One" } });
    fireEvent.submit(document.getElementById("sandbox-form")!);
    expect(await screen.findByText("Sandbox created", {}, wait)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`/projects/${FHIR}/sandboxes`));
    fireEvent.click(screen.getByRole("button", { name: "Go to the root" }));
    const child = screen.getByText("child-one").closest("[id^=sandbox-card-]")!.id.replace("sandbox-card-", "");
    fireEvent.click(document.querySelector(`#delete-sandbox-${child} button`)!);
    fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "child-one" } });
    fireEvent.submit(document.getElementById("confirm-delete-sandbox-form")!);
    expect(await screen.findByText("Sandbox child-one scheduled for deletion.", {}, wait)).toBeTruthy();
    expect(screen.getByTestId("where").textContent).toBe(`/projects/${ROOT}/sandboxes`);
  }, 10_000);

  it("lets an owner of a sandbox manage it without managing the rest of the workspace", async () => {
    // Esther is an editor on the root and on fhir-mapping-v2, and owns the sandbox she creates.
    renderAt(`/projects/${FHIR}/sandboxes/new`, { ...session, user: findUser("user-esther")! });
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Mine" } });
    fireEvent.submit(document.getElementById("sandbox-form")!);
    expect(await screen.findByText("Sandbox created", {}, wait)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`/projects/${FHIR}/sandboxes`));
    const mine = screen.getByText("mine").closest("[id^=sandbox-card-]")!.id.replace("sandbox-card-", "");
    for (const kind of ["branch-rewire", "edit", "delete"]) {
      expect(isDisabled((document.querySelector(`#${kind}-sandbox-${mine} button`) as HTMLButtonElement))).toBe(false);
      expect(isDisabled(document.querySelector(`#${kind}-sandbox-${FHIR} button`))).toBe(true);
    }
  }, 10_000);
  it("previews the merge into the parent with Lightning's badges, then toasts the merge and opens the parent's workflows", async () => {
    renderAt(`/projects/${ROOT}/sandboxes`);
    fireEvent.click(document.querySelector(`#branch-rewire-sandbox-${FHIR} button`)!);
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByText("Workflows to merge", {}, wait);
    const rows = Array.from(dialog.querySelectorAll("li label")).map((l) => l.textContent);
    expect(rows).toEqual([
      "FHIR bundle exportNew",
      "Facility registry syncDeleted in sandbox",
      "OpenHIE WorkflowChangedDiverged",
      "Referral follow-ups",
      "FHIR sandbox server",
      "fhir-staging-cache",
    ]);
    fireEvent.submit(document.getElementById("merge-sandbox-form")!);
    expect(await screen.findByText("Successfully merged fhir-mapping-v2 into openhie-project. Sandbox scheduled for deletion.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId("where").textContent).toBe(`/projects/${ROOT}/w`));
  }, 10_000);
});

import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sandboxColorPalette } from "@/constants";
import { isDisabled } from "@/test/disabled";
import { renderPage } from "@/test/renderPage";
import { pickOption } from "@/test/select";
import { tooltipOf } from "@/test/tooltip";
import type { MergePreviewResult, SandboxRow } from "@/types/sandboxes";
import { RequestError } from "@/utils/errors";
import SandboxesIndexPage, { type SandboxesIndexPageProps } from "./SandboxesIndexPage";

const row = (id: string, name: string, more: Partial<SandboxRow> = {}): SandboxRow => ({
  id,
  name,
  description: null,
  color: "#5AA1F0",
  parentId: "p1",
  parentName: "openhie-project",
  scheduledDeletion: null,
  canEdit: true,
  canDelete: true,
  canMerge: true,
  canCancelDeletion: false,
  descendantCount: 0,
  holdsCurrent: false,
  mergeTargets: [{ id: "p1", name: "openhie-project" }],
  ...more,
});
const root = row("p1", "openhie-project", { parentId: null, parentName: null, canEdit: false, canDelete: false, canMerge: false, holdsCurrent: true });
const fhir = row("s1", "fhir-mapping", { description: "FHIR R4 mappings", descendantCount: 2, mergeTargets: [{ id: "p1", name: "openhie-project" }, { id: "s3", name: "staging" }] });
const staging = row("s3", "staging");
const gone = row("s2", "old-import", { scheduledDeletion: "2026-10-21T00:00:00Z", canEdit: false, canDelete: false, canMerge: false, canCancelDeletion: true });

type Data = Omit<SandboxesIndexPageProps, `on${string}`>;
const render = (data: Partial<Data> = {}) =>
  renderPage(
    SandboxesIndexPage,
    {
      project: { id: "p1", parentId: null, color: null },
      projectLabel: "openhie-project",
      root,
      rootIsSandbox: false,
      sandboxes: [fhir, gone, staging],
      canCreateSandbox: true,
      sandboxLimit: null,
      gracePeriodDays: 7,
      createHref: "/projects/p1/sandboxes/new",
      workflowsHref: (id) => `/projects/${id}/w`,
      editHref: (id) => `/projects/p1/sandboxes/${id}/edit`,
      creating: false,
      editingId: null,
      ...data,
    },
    ["onClose", "onCreate", "onUpdate", "onDelete", "onCancelDeletion", "onPreviewMerge", "onMerge"]
  );

const section = (title: string) => screen.getByRole("heading", { name: title }).closest("section")!;
const cardOf = (name: string) => screen.getByRole("heading", { name }).closest("[data-ui=card]") as HTMLElement;
const dialog = () => screen.getByRole("dialog");
// The section's heading first, then its cards'.
const namesIn = (title: string) => within(section(title)).getAllByRole("heading").slice(1).map((h) => h.textContent);
const choose = async (name: string, item: string) => {
  await userEvent.click(within(cardOf(name)).getByRole("button", { name: `Actions for ${name}` }));
  return screen.getByRole("menuitem", { name: new RegExp(`^${item}`) });
};

describe("SandboxesIndexPage", () => {
  it("puts the page's project under Selected, the rest under Active with the top project first, then the scheduled ones", () => {
    render();
    expect(screen.getByText("Isolated copies of this project for trying out changes before merging them back.")).toBeTruthy();
    const main = cardOf("openhie-project");
    expect(section("Selected").contains(main)).toBe(true);
    expect(main.textContent).toContain("Selected");
    expect(main.textContent).toContain("Main");
    expect(main.textContent).toContain("The live version of this project. Sandboxes merge back into main.");
    // You're already there, and the top project has no actions.
    expect(within(main).queryByRole("link")).toBeNull();
    expect(within(main).queryByRole("button")).toBeNull();

    expect(namesIn("Active")).toEqual(["fhir-mapping", "staging"]);
    expect(within(cardOf("fhir-mapping")).getByRole("link", { name: "fhir-mapping" }).getAttribute("href")).toBe("/projects/s1/w");
    expect(cardOf("fhir-mapping").textContent).toContain("FHIR R4 mappings");
    expect(cardOf("fhir-mapping").textContent).toContain("Made from openhie-project");
    expect(cardOf("staging").textContent).toContain("No description");

    const scheduled = cardOf("old-import");
    expect(section("Scheduled for deletion").contains(scheduled)).toBe(true);
    expect(within(scheduled).queryByRole("link")).toBeNull();
    expect(within(scheduled).getByRole("button", { name: "Restore" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "New sandbox" }).getAttribute("href")).toBe("/projects/p1/sandboxes/new");
  });

  it("in a sandbox, puts main under Active, linking to its workflows", () => {
    render({ project: { id: "s1", parentId: "p1", color: null } });
    expect(section("Selected").contains(cardOf("fhir-mapping"))).toBe(true);
    expect(namesIn("Active")).toEqual(["openhie-project", "staging"]);
    expect(within(cardOf("openhie-project")).getByRole("link", { name: "openhie-project" }).getAttribute("href")).toBe("/projects/p1/w");
  });

  it("with no other sandboxes, says so in words under Active, with New sandbox only in the header", () => {
    render({ sandboxes: [] });
    expect(section("Active").textContent).toContain("No other sandboxes");
    expect(section("Active").textContent).toContain("Create a sandbox to try out changes without touching main.");
    expect(screen.getAllByRole("link", { name: /New sandbox/ })).toHaveLength(1);
  });

  it("offers Edit, Merge and Delete in one menu, Delete last, Edit opening its form's link", async () => {
    render();
    const edit = await choose("fhir-mapping", "Edit");
    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Edit", "Merge", "Delete"]);
    expect(edit.getAttribute("href")).toBe("/projects/p1/sandboxes/s1/edit");
  });

  it("for a viewer, greys New sandbox and each menu item with Lightning's reason", async () => {
    render({ canCreateSandbox: false, sandboxes: [{ ...fhir, canEdit: false, canDelete: false, canMerge: false }] });
    const create = screen.getByRole("button", { name: "New sandbox" });
    expect(isDisabled(create)).toBe(true);
    expect(await tooltipOf(create)).toBe("You are not authorized to create sandboxes in this workspace");
    await choose("fhir-mapping", "Edit");
    expect(screen.getAllByRole("menuitem").map((i) => [i.textContent, isDisabled(i)])).toEqual([
      ["EditYou are not authorized to edit this sandbox", true],
      ["MergeYou are not authorized to merge this sandbox", true],
      ["DeleteYou are not authorized to delete this sandbox", true],
    ]);
  });

  it("at the plan's limit, greys New sandbox and Restore with its message; without permission, Restore says so", async () => {
    render({ sandboxLimit: "Upgrade to make more sandboxes", sandboxes: [gone, { ...gone, id: "s4", name: "older", canCancelDeletion: false }] });
    expect(await tooltipOf(screen.getByRole("button", { name: "New sandbox" }))).toBe("Upgrade to make more sandboxes");
    expect(await tooltipOf(within(cardOf("old-import")).getByRole("button", { name: "Restore" }))).toBe("Upgrade to make more sandboxes");
    expect(await tooltipOf(within(cardOf("older")).getByRole("button", { name: "Restore" }))).toBe("You are not authorized to cancel deletion of this sandbox");
  });

  describe("the form", () => {
    it("keeps Create sandbox enabled, and pressing it with a blank name says so without saving", async () => {
      const host = render({ creating: true });
      expect(within(dialog()).getByRole("heading", { name: "New sandbox" })).toBeTruthy();
      expect(dialog().textContent).toContain("This sandbox will be created under the openhie-project project.");
      expect(within(dialog()).getByText("my-sandbox").parentElement!.textContent).toBe("Your sandbox will be namedmy-sandbox.");
      fireEvent.click(within(dialog()).getByRole("button", { name: "Create sandbox" }));
      expect(await within(dialog()).findByText("can't be blank")).toBeTruthy();
      expect(host.calls("onCreate")).toEqual([]);
    });

    it("creates with the URL-safe name and the next palette colour, then says where it came from", async () => {
      const host = render({ creating: true });
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "My Sandbox" } });
      fireEvent.click(within(dialog()).getByRole("button", { name: "Create sandbox" }));
      await waitFor(() => expect(host.calls("onCreate")).toEqual([[{ name: "my-sandbox", color: sandboxColorPalette[3] }]]));
      await host.resolve("onCreate");
      expect(screen.getByText("Created a sandbox from openhie-project.")).toBeTruthy();
    });

    it("keeps the form open with the server's refusal under Name", async () => {
      const host = render({ creating: true });
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "staging" } });
      fireEvent.click(within(dialog()).getByRole("button", { name: "Create sandbox" }));
      await waitFor(() => expect(host.calls("onCreate")).toHaveLength(1));
      await host.reject("onCreate", new RequestError("The request body is not valid.", { fieldErrors: { name: ["Sandbox name already exists"] } }));
      const error = within(dialog()).getByText("Sandbox name already exists");
      expect(screen.getByLabelText(/^Name/).getAttribute("aria-describedby")).toContain(error.id);
    });

    it("edits the sandbox's name and colour, then closes and says so", async () => {
      const host = render({ editingId: "s1" });
      expect(within(dialog()).getByRole("heading", { name: "Edit fhir-mapping" })).toBeTruthy();
      fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: "fhir-r4" } });
      fireEvent.click(screen.getByLabelText(sandboxColorPalette[0]!));
      fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
      await waitFor(() => expect(host.calls("onUpdate")).toEqual([[fhir, { name: "fhir-r4", color: sandboxColorPalette[0] }]]));
      expect(host.calls("onClose")).toEqual([]);
      await host.resolve("onUpdate");
      expect(host.calls("onClose")).toHaveLength(1);
      expect(screen.getByText("Sandbox updated")).toBeTruthy();
    });
  });

  it("deletes once the name is typed, keeping the dialog open on a refusal", async () => {
    const host = render();
    await userEvent.click(await choose("fhir-mapping", "Delete"));
    expect(dialog().textContent).toContain("Its 2 child sandboxes will also be deleted.");
    const confirm = within(dialog()).getByRole("button", { name: "Delete sandbox" });
    expect(isDisabled(confirm)).toBe(true);
    fireEvent.change(within(dialog()).getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(host.calls("onDelete")).toEqual([[fhir]]));
    await host.reject("onDelete", new RequestError("You are not allowed to do that."));
    expect(within(dialog()).getByText("You are not allowed to do that.")).toBeTruthy();

    fireEvent.click(confirm);
    await waitFor(() => expect(host.calls("onDelete")).toHaveLength(2));
    await host.resolve("onDelete");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Sandbox fhir-mapping scheduled for deletion.")).toBeTruthy();
  });

  it("warns when deleting takes the page's project, naming where you'll go", async () => {
    render({ project: { id: "s1", parentId: "p1", color: null }, sandboxes: [{ ...fhir, holdsCurrent: true }] });
    await userEvent.click(await choose("fhir-mapping", "Delete"));
    expect(dialog().textContent).toContain("You are currently viewing this project. After deletion, you'll be redirected to openhie-project.");
  });

  it("spins only the sandbox being restored, then says so", async () => {
    const host = render({ sandboxes: [gone, { ...gone, id: "s4", name: "older" }] });
    const restore = within(cardOf("old-import")).getByRole("button", { name: "Restore" });
    fireEvent.click(restore);
    expect(host.calls("onCancelDeletion")).toEqual([["s2"]]);
    expect(restore.getAttribute("aria-busy")).toBe("true");
    expect(within(cardOf("older")).getByRole("button", { name: "Restore" }).getAttribute("aria-busy")).toBeNull();
    await host.resolve("onCancelDeletion");
    expect(screen.getByText("Cancelled deletion of sandbox old-import.")).toBeTruthy();
  });

  describe("merge", () => {
    const preview = (targetId: string, more: Partial<MergePreviewResult> = {}): MergePreviewResult => ({
      targetId,
      workflows: [
        { id: "w1", name: "intake", isDiverged: true, isDeleted: false },
        { id: "w2", name: "reporting", isDiverged: false, isDeleted: true },
      ],
      credentials: [{ id: "c1", name: "DHIS2 sandbox" }],
      ...more,
    });
    // The target select is named "Merge into …" too.
    const mergeButton = () => document.getElementById("merge-sandbox-submit")!;
    const open = async () => {
      const host = render();
      await userEvent.click(await choose("fhir-mapping", "Merge"));
      return host;
    };

    it("previews the parent first, ticking changes and credentials but not deletions, and warns about the diverged one", async () => {
      const host = await open();
      expect(within(dialog()).getByRole("heading", { name: "Merge fhir-mapping" })).toBeTruthy();
      expect(within(dialog()).getByRole("status", { name: "Loading the merge preview" })).toBeTruthy();
      expect(host.calls("onPreviewMerge")).toEqual([[fhir, "p1"]]);
      await host.resolve("onPreviewMerge", preview("p1"));
      expect((screen.getByLabelText(/^intake/) as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText(/^reporting/) as HTMLInputElement).checked).toBe(false);
      expect((screen.getByLabelText("DHIS2 sandbox") as HTMLInputElement).checked).toBe(true);
      expect(dialog().textContent).toContain("Changed in openhie-project too");
      expect(dialog().textContent).toContain("Deleted in sandbox");
      expect(dialog().textContent).toContain(
        "Merging replaces intake in openhie-project with this sandbox's version, and the changes made in openhie-project are lost."
      );
      expect(dialog().textContent).toContain("Its 2 child sandboxes will also be deleted.");
    });

    it("previews again on a new target, using only the newest answer", async () => {
      const host = await open();
      await pickOption(document.getElementById("merge-target-select")!, "staging");
      expect(host.calls("onPreviewMerge")).toEqual([[fhir, "p1"], [fhir, "s3"]]);
      await host.resolve("onPreviewMerge", preview("p1"));
      expect(screen.queryByLabelText(/^intake/)).toBeNull();
      await host.resolve("onPreviewMerge", preview("s3", { workflows: [] }));
      expect(dialog().textContent).toContain("No workflow has changed in this sandbox.");
      expect(mergeButton().textContent).toBe("Merge into staging");
    });

    it("shows a failed preview in the dialog and holds Merge", async () => {
      const host = await open();
      await host.reject("onPreviewMerge", new RequestError("You are not allowed to do that."));
      expect(within(dialog()).getByText("You are not allowed to do that.")).toBeTruthy();
      expect(isDisabled(mergeButton())).toBe(true);
    });

    it("holds Merge with nothing ticked", async () => {
      const host = await open();
      await host.resolve("onPreviewMerge", preview("p1", { credentials: [] }));
      fireEvent.click(screen.getByLabelText(/^intake/));
      expect(isDisabled(mergeButton())).toBe(true);
    });

    it("sends what's ticked, keeps the dialog open on a refusal, and says so once merged", async () => {
      const host = await open();
      await host.resolve("onPreviewMerge", preview("p1"));
      fireEvent.click(screen.getByLabelText(/^reporting/));
      const merge = mergeButton();
      expect(merge.textContent).toBe("Merge into openhie-project");
      fireEvent.click(merge);
      await waitFor(() =>
        expect(host.calls("onMerge")).toEqual([[fhir, { targetId: "p1", workflowIds: ["w1"], deletedWorkflowIds: ["w2"], credentialIds: ["c1"] }]])
      );
      await host.reject("onMerge", new RequestError("You are not authorized to merge into this project"));
      expect(within(dialog()).getByText("You are not authorized to merge into this project")).toBeTruthy();

      fireEvent.click(merge);
      await waitFor(() => expect(host.calls("onMerge")).toHaveLength(2));
      await host.resolve("onMerge");
      expect(screen.getByText("Merged fhir-mapping into openhie-project. Sandbox scheduled for deletion.")).toBeTruthy();
    });
  });
});

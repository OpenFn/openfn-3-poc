import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import { pickOption } from "@/test/select";
import { tooltipOf } from "@/test/tooltip";
import type { AdminCollectionRow } from "@/types/admin";
import { RequestError } from "@/utils/errors";
import AdminCollectionsPage, { type AdminCollectionsPageProps } from "./AdminCollectionsPage";

const rows: AdminCollectionRow[] = [
  { id: "c1", name: "patients", projectId: "p1", projectName: "Malawi HIV", byteSizeSum: 2_500_000 },
  { id: "c2", name: "visits", projectId: "p2", projectName: "Kenya TB", byteSizeSum: 100 },
];

const render = (data: Partial<Omit<AdminCollectionsPageProps, "onSort" | "onCreate" | "onUpdate">> = {}) =>
  renderPage(
    AdminCollectionsPage,
    {
      collections: rows,
      sort: { key: "name", direction: "asc" },
      projectOptions: [
        ["Kenya TB", "p2"],
        ["Malawi HIV", "p1"],
      ],
      ...data,
    },
    ["onSort", "onCreate", "onUpdate"]
  );

const names = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.firstElementChild?.textContent);
const dialog = () => screen.getByRole("dialog");
const projectPicker = () => within(dialog()).getByRole("button", { name: /^Project/ });

describe("AdminCollectionsPage", () => {
  it("lists the collections in the order given, with their project and storage", () => {
    render();
    expect(screen.getByRole("heading", { name: "Collections (2)" })).toBeTruthy();
    expect(names()).toEqual(["patients", "visits"]);
    const patients = screen.getByText("patients").closest("tr")!;
    expect(patients.textContent).toContain("Malawi HIV");
    expect(patients.textContent).toContain("2.5 MB");
  });

  it("asks for another order from a header: a new column ascending, the current one flipped", () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: /Size/ }));
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(host.calls("onSort")).toEqual([[{ key: "byte_size_sum", direction: "asc" }], [{ key: "name", direction: "desc" }]]);
  });

  it("with no collections, Create stays in the header and the empty state is words only", () => {
    render({ collections: [] });
    expect(screen.getByText("No collections yet.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Create/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    expect(within(dialog()).getByRole("heading", { name: "Create collection" })).toBeTruthy();
  });

  it("shows no empty state while the collections load, and Create is already there", () => {
    render({ collections: [], status: { state: "loading" } });
    expect(screen.queryByText("No collections yet.")).toBeNull();
    expect(screen.getByRole("button", { name: "Create collection" })).toBeTruthy();
  });

  it("keeps Create enabled, and pressing it on a blank form says what is missing without saving", () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    expect(projectPicker().textContent).toBe("Select a project");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create collection" }));
    expect(within(dialog()).getAllByText("can't be blank")).toHaveLength(2);
    expect(host.calls("onCreate")).toEqual([]);
  });

  it("closes the create form on Cancel without saving", () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(host.calls("onCreate")).toEqual([]);
  });

  it("creates a collection with the URL-safe name in the chosen project, then closes and says so", async () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "New Collection" } });
    expect(dialog().textContent).toContain("This collection will be named");
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe("New Collection");
    await pickOption(projectPicker(), "Malawi HIV");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create collection" }));

    await waitFor(() => expect(host.calls("onCreate")).toEqual([[{ name: "new-collection", project_id: "p1" }]]));
    expect(dialog()).toBeTruthy();
    await host.resolve("onCreate");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Collection created successfully")).toBeTruthy();
  });

  it("edits a collection from its name and project, moves it, and keeps the form open on a refusal", async () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Edit patients in Malawi HIV" }));
    expect(within(dialog()).getByRole("heading", { name: "Edit collection" })).toBeTruthy();
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe("patients");
    expect(projectPicker().textContent).toBe("Malawi HIV");
    await pickOption(projectPicker(), "Kenya TB");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(host.calls("onUpdate")).toEqual([["c1", { name: "patients", project_id: "p2" }]]));
    await host.reject("onUpdate", new RequestError("The request body is not valid.", { fieldErrors: { name: ["A collection with this name already exists"] } }));
    expect(screen.getByText("A collection with this name already exists")).toBeTruthy();
    expect(dialog()).toBeTruthy();
    expect(screen.queryByText("Collection updated successfully")).toBeNull();
  });

  it("shows Delete disabled, saying it isn't in the API yet", async () => {
    render();
    const del = screen.getByRole("button", { name: "Delete patients in Malawi HIV" });
    fireEvent.click(del);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(await tooltipOf(del)).toBe("Not available in the API yet");
  });
});

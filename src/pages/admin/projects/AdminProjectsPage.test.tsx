import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import { pickOption } from "@/test/select";
import type { AdminProjectRow } from "@/types/admin";
import { RequestError } from "@/utils/errors";
import AdminProjectsPage, { type AdminProjectsPageProps } from "./AdminProjectsPage";

const rows: AdminProjectRow[] = [
  { id: "p1", name: "malawi-hiv", ownerName: "Ada Lovelace", membersCount: 3, insertedAt: "2024-03-12T10:00:00Z", scheduledDeletion: null },
  { id: "p2", name: "kenya-tb", ownerName: null, membersCount: 0, insertedAt: "2023-11-20T09:00:00Z", scheduledDeletion: "2026-11-10T09:00:00Z" },
];

const actions = ["onSearch", "onSort", "onClose", "onCreate", "onScheduleDeletion", "onCancelDeletion"] as const;

const render = (data: Partial<Omit<AdminProjectsPageProps, (typeof actions)[number]>> = {}) =>
  renderPage(
    AdminProjectsPage,
    {
      projects: rows,
      page: { number: 1, size: 25, totalPages: 1 },
      search: "",
      sort: { key: "name", direction: "asc" },
      createHref: "/settings/projects/new?q=a",
      deleteHref: (id) => `/settings/projects/${id}/delete?q=a`,
      creating: false,
      users: [
        { id: "u1", firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
        { id: "u2", firstName: "Grace", lastName: "Hopper", email: "grace@example.com" },
      ],
      deleting: null,
      gracePeriodDays: 7,
      ...data,
    },
    [...actions]
  );

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const dialog = () => screen.getByRole("dialog");
const create = () => fireEvent.click(within(dialog()).getByRole("button", { name: "Create project" }));

describe("AdminProjectsPage", () => {
  it("lists each project with its owner or No owner, its members, when it was made, and when it's due to be deleted", () => {
    render();
    expect(screen.getByRole("heading", { name: "Projects" })).toBeTruthy();
    expect(screen.getByText("Every project on this instance, whoever is in it.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "New project" }).getAttribute("href")).toBe("/settings/projects/new?q=a");
    expect(rowOf("malawi-hiv").textContent).toContain("Ada Lovelace");
    expect(rowOf("malawi-hiv").textContent).toContain("3");
    expect(rowOf("malawi-hiv").textContent).toContain("12 Mar 2024");
    expect(rowOf("kenya-tb").textContent).toContain("No owner");
    expect(rowOf("kenya-tb").textContent).toContain("Deletes 10 Nov 2026");
    expect(screen.queryByRole("link", { name: /Edit/ })).toBeNull();
  });

  it("asks for another order from Project and Created only: a new column ascending, the current one flipped", () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: /Created/ }));
    fireEvent.click(screen.getByRole("button", { name: /Project/ }));
    expect(host.calls("onSort")).toEqual([[{ key: "inserted_at", direction: "asc" }], [{ key: "name", direction: "desc" }]]);
    expect(screen.queryByRole("button", { name: /Owner/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Members/ })).toBeNull();
  });

  it("with no projects, says none match in words only, and the search and New project stay in the header", () => {
    render({ projects: [], search: "zzz" });
    expect(screen.getByText("No projects match.")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Filter projects" }) as HTMLInputElement).value).toBe("zzz");
    expect(screen.getAllByRole("link", { name: /New project/ })).toHaveLength(1);
  });

  it("shows no empty state while the projects load, and New project is already there", () => {
    render({ projects: [], status: { state: "loading" } });
    expect(screen.queryByText("No projects match.")).toBeNull();
    expect(screen.getByRole("link", { name: "New project" })).toBeTruthy();
  });

  it("links a live project's Delete to its dialog, keeping the list's query", () => {
    render();
    expect(screen.getByRole("link", { name: "Delete malawi-hiv" }).getAttribute("href")).toBe("/settings/projects/p1/delete?q=a");
    expect(within(rowOf("malawi-hiv")).queryByRole("button", { name: /More actions/ })).toBeNull();
  });

  it("cancels a scheduled deletion with no confirm, pending on that row only, then says so", async () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion of kenya-tb" }));
    expect(host.calls("onCancelDeletion")).toEqual([["p2"]]);
    expect(screen.getByRole("button", { name: "Cancel deletion of kenya-tb" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("link", { name: "New project" })).toBeTruthy();
    await host.resolve("onCancelDeletion");
    expect(screen.getByText("Project deletion canceled")).toBeTruthy();
  });

  it("toasts a failed cancel with the server's words", async () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion of kenya-tb" }));
    await host.reject("onCancelDeletion", new RequestError("This project isn't scheduled for deletion."));
    expect(screen.getByRole("alert").textContent).toContain("This project isn't scheduled for deletion.");
  });

  it("schedules the open dialog's project once its name is typed, then closes and says so", async () => {
    const host = render({ deleting: rows[0]! });
    expect(dialog().textContent).toContain("7 day(s) from today");
    fireEvent.change(within(dialog()).getByLabelText(/Project name/), { target: { value: "malawi-hiv" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete project" }));
    await waitFor(() => expect(host.calls("onScheduleDeletion")).toEqual([["p1"]]));
    await host.resolve("onScheduleDeletion");
    expect(host.calls("onClose")).toHaveLength(1);
    expect(screen.getByText("Project scheduled for deletion")).toBeTruthy();
  });

  it("keeps Create project enabled, and pressing it on a blank form says what is missing without saving", () => {
    const host = render({ creating: true });
    expect(within(dialog()).getByRole("heading", { name: "New project" })).toBeTruthy();
    create();
    expect(within(dialog()).getByText("can't be blank")).toBeTruthy();
    expect(within(dialog()).getByText("Every project must have exactly one owner.")).toBeTruthy();
    expect(host.calls("onCreate")).toEqual([]);
  });

  it("creates a project with the URL-safe name, a description and each member's role, keeping roles the filter hides", async () => {
    const host = render({ creating: true });
    const name = within(dialog()).getByLabelText(/Name/) as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Malaria Programme" } });
    expect(name.value).toBe("Malaria Programme");
    expect(dialog().textContent).toContain("Note that this project will be named:");
    fireEvent.change(within(dialog()).getByLabelText("Description"), { target: { value: "Case reports" } });
    await pickOption(within(dialog()).getByRole("button", { name: /Ada Lovelace's role/ }), "Owner");
    await pickOption(within(dialog()).getByRole("button", { name: /Grace Hopper's role/ }), "Editor");
    fireEvent.change(within(dialog()).getByRole("textbox", { name: "Filter users" }), { target: { value: "grace" } });
    expect(within(dialog()).queryByText("Ada Lovelace")).toBeNull();
    create();

    await waitFor(() =>
      expect(host.calls("onCreate")).toEqual([
        [{ name: "malaria-programme", description: "Case reports", members: [{ email: "ada@example.com", role: "owner" }, { email: "grace@example.com", role: "editor" }] }],
      ])
    );
    expect(host.calls("onClose")).toHaveLength(0);
    await host.resolve("onCreate");
    expect(host.calls("onClose")).toHaveLength(1);
    expect(screen.getByText("Project created successfully")).toBeTruthy();
  });

  it("shows the server's member errors under Members, naming whose email it was", async () => {
    const host = render({ creating: true });
    fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: "x" } });
    await pickOption(within(dialog()).getByRole("button", { name: /Ada Lovelace's role/ }), "Owner");
    await pickOption(within(dialog()).getByRole("button", { name: /Grace Hopper's role/ }), "Owner");
    create();
    await waitFor(() => expect(host.calls("onCreate")).toHaveLength(1));
    await host.reject(
      "onCreate",
      new RequestError("The request body is not valid.", {
        status: 422,
        fieldErrors: { members: ["A project can have only one owner."], "members.1.email": ["has no account"] },
      })
    );
    const members = within(screen.getByRole("group", { name: /Members/ }));
    expect(members.getByText("A project can have only one owner.")).toBeTruthy();
    expect(members.getByText("grace@example.com has no account")).toBeTruthy();
    expect(host.calls("onClose")).toHaveLength(0);
  });
});

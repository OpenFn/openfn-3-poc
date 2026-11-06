import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isDisabled } from "@/test/disabled";
import { renderPage } from "@/test/renderPage";
import { tooltipOf } from "@/test/tooltip";
import type { AdminUserListRow } from "@/types/admin";
import AdminUsersPage, { type AdminUsersPageProps } from "./AdminUsersPage";

const ada: AdminUserListRow = {
  id: "u1",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  role: "superuser",
  supportUser: false,
  disabled: false,
  scheduledDeletion: null,
  hasActivityInProjects: false,
  canDelete: false,
};
const grace: AdminUserListRow = { ...ada, id: "u2", firstName: "Grace", lastName: "Hopper", email: "grace@example.com" };
const alan: AdminUserListRow = { ...ada, id: "u3", firstName: "Alan", lastName: "Turing", email: "alan@example.com", role: "user", supportUser: true, hasActivityInProjects: true, canDelete: true };
const kurt: AdminUserListRow = { ...alan, id: "u4", firstName: "Kurt", lastName: "Gödel", email: "kurt@example.com", supportUser: false, disabled: true, scheduledDeletion: "2026-10-21T09:30:00Z" };

const actions = ["onSearch", "onSort", "onClose", "onScheduleDeletion", "onCancelDeletion"] as const;

const render = (data: Partial<Omit<AdminUsersPageProps, (typeof actions)[number]>> = {}) =>
  renderPage(
    AdminUsersPage,
    {
      users: [ada, grace, alan, kurt],
      page: { number: 1, size: 25, totalPages: 1 },
      currentUserId: "u1",
      search: "",
      sort: { key: "first_name", direction: "asc" },
      createHref: "/settings/users/new?q=a",
      editHref: (id) => `/settings/users/${id}?q=a`,
      deleteHref: (id) => `/settings/users/${id}/delete?q=a`,
      deleting: null,
      ...data,
    },
    [...actions]
  );

const rowOf = (email: string) => screen.getByText(email).closest("tr")!;
// What one row shows, as each badge or line on its own.
const shown = (email: string, ...texts: string[]) => texts.forEach((text) => expect(within(rowOf(email)).getByText(text)).toBeTruthy());
const dialog = () => screen.getByRole("dialog");

describe("AdminUsersPage", () => {
  it("lists each account's name, email, role and status, with (you) on your own row", () => {
    render();
    expect(screen.getByRole("heading", { name: "Users" })).toBeTruthy();
    expect(
      screen.getByText("Every account on this instance. Adding people to a project and changing their role there is usually done by the project's admins, in its settings.")
    ).toBeTruthy();
    expect(screen.getByText("A superuser can reach everything on this instance, across every project, including these settings.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "New user" }).getAttribute("href")).toBe("/settings/users/new?q=a");
    expect(rowOf("ada@example.com").textContent).toContain("Ada Lovelace (you)");
    expect(rowOf("grace@example.com").textContent).not.toContain("(you)");
    shown("ada@example.com", "Superuser", "Enabled");
    shown("alan@example.com", "Alan Turing", "User", "Support", "Enabled");
    shown("kurt@example.com", "User", "Disabled", "Deletes 21 Oct 2026");
  });

  it("asks for another order from Name, Role and Status: a new column ascending, the current one flipped", () => {
    const host = render();
    fireEvent.click(screen.getByRole("button", { name: /Role/ }));
    fireEvent.click(screen.getByRole("button", { name: /Status/ }));
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(host.calls("onSort")).toEqual([
      [{ key: "role", direction: "asc" }],
      [{ key: "disabled", direction: "asc" }],
      [{ key: "first_name", direction: "desc" }],
    ]);
  });

  it("with no users, says none match in words only, and the search and New user stay in the header", () => {
    render({ users: [], search: "zzz" });
    expect(screen.getByText("No users match.")).toBeTruthy();
    expect((screen.getByRole("textbox", { name: "Filter users" }) as HTMLInputElement).value).toBe("zzz");
    expect(screen.getAllByRole("link", { name: /New user/ })).toHaveLength(1);
  });

  it("shows no empty state while the users load, and New user is already there", () => {
    render({ users: [], status: { state: "loading" } });
    expect(screen.queryByText("No users match.")).toBeNull();
    expect(screen.getByRole("link", { name: "New user" })).toBeTruthy();
  });

  it("links Edit and a live user's Delete to their routes, keeping the list's query", () => {
    render();
    expect(screen.getByRole("link", { name: "Edit Alan Turing" }).getAttribute("href")).toBe("/settings/users/u3?q=a");
    expect(screen.getByRole("link", { name: "Delete Alan Turing" }).getAttribute("href")).toBe("/settings/users/u3/delete?q=a");
    expect(within(rowOf("alan@example.com")).queryByRole("button", { name: /More actions/ })).toBeNull();
  });

  it("disables a superuser's Delete, saying why for your own account and for another superuser's", async () => {
    render();
    const own = screen.getByRole("button", { name: "Delete Ada Lovelace" });
    const other = screen.getByRole("button", { name: "Delete Grace Hopper" });
    expect(isDisabled(own)).toBe(true);
    expect(isDisabled(other)).toBe(true);
    expect(await tooltipOf(own)).toBe("You can't delete your own account");
    expect(await tooltipOf(other)).toBe("Superusers can't be deleted");
  });

  it("cancels a scheduled deletion with no confirm, pending on that row only, then says so", async () => {
    const emmy = { ...kurt, id: "u5", firstName: "Emmy", lastName: "Noether", email: "emmy@example.com" };
    const host = render({ users: [kurt, emmy] });
    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion of Kurt Gödel" }));
    expect(host.calls("onCancelDeletion")).toEqual([["u4"]]);
    expect(screen.getByRole("button", { name: "Cancel deletion of Kurt Gödel" }).getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("button", { name: "Cancel deletion of Emmy Noether" }).getAttribute("aria-busy")).toBeNull();
    expect(screen.queryByText("User deletion canceled")).toBeNull();
    await host.resolve("onCancelDeletion");
    expect(screen.getByText("User deletion canceled")).toBeTruthy();
  });

  it("schedules the open dialog's user once their email is typed, noting their activity, then closes and says so", async () => {
    const host = render({ deleting: alan });
    expect(dialog().textContent).toContain("this user still has activity related to active projects");
    fireEvent.change(within(dialog()).getByLabelText(/User email/), { target: { value: "alan@example.com" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete account" }));
    await waitFor(() => expect(host.calls("onScheduleDeletion")).toEqual([["u3"]]));
    expect(host.calls("onClose")).toHaveLength(0);
    expect(screen.queryByText("User scheduled for deletion")).toBeNull();
    await host.resolve("onScheduleDeletion");
    expect(host.calls("onClose")).toHaveLength(1);
    expect(screen.getByText("User scheduled for deletion")).toBeTruthy();
  });
});

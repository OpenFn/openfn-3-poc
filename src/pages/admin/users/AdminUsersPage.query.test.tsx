import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { session, users } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import { isDisabled } from "@/test/disabled";
import { pickOption } from "@/test/select";
import AdminUsersPageQuery from "./AdminUsersPage.query";

const wait = { timeout: 3000 };

function Where() {
  const { pathname, search } = useLocation();
  return <output data-testid="where">{pathname + search}</output>;
}

function renderAt(path = "/settings/users") {
  const page = (
    <>
      <AdminUsersPageQuery />
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
                <Route path="/settings/users" element={page} />
                <Route path="/settings/users/new" element={page} />
                <Route path="/settings/users/:userId" element={page} />
                <Route path="/settings/users/:userId/delete" element={page} />
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

const where = () => screen.getByTestId("where").textContent;
const emails = () =>
  within(screen.getByRole("table"))
    .getAllByRole("row")
    .slice(1)
    .map((row) => users.find((u) => row.textContent?.includes(u.email))?.email);
const rowOf = (email: string) => screen.getByText(email).closest("tr")!;
// What one row shows, as each badge or line on its own.
const shown = (email: string, ...texts: (string | RegExp)[]) => texts.forEach((text) => expect(within(rowOf(email)).getByText(text)).toBeTruthy());
const dialog = () => screen.getByRole("dialog");
const user = (id: string) => users.find((u) => u.id === id)!;
const amy = user("user-amy");
const esther = user("user-esther");
const vikram = user("user-vikram");
const sizwe = user("user-sizwe");

function scheduleEsther() {
  fireEvent.change(within(dialog()).getByLabelText(/User email/), { target: { value: esther.email } });
  fireEvent.click(within(dialog()).getByRole("button", { name: "Delete account" }));
}

describe("AdminUsersPageQuery", { timeout: 10_000 }, () => {
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

  it("loads every user on the instance by first name, with their role and status", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(emails()).toEqual([amy.email, esther.email, sizwe.email, vikram.email]);
    expect(screen.getByRole("columnheader", { name: /Name/ }).getAttribute("aria-sort")).toBe("ascending");
    expect(rowOf(amy.email).textContent).toContain("Amy Admin (you)");
    shown(sizwe.email, "Superuser", "Enabled");
    shown(vikram.email, "User", "Enabled");
  });

  it("sorts by Role from the URL and its header, and searches through ?q= on the server, back to the first page", async () => {
    renderAt("/settings/users?sort=role&dir=desc&page=2");
    await waitFor(() => expect(emails()).toEqual([esther.email, vikram.email, amy.email, sizwe.email]), wait);
    fireEvent.change(screen.getByRole("textbox", { name: "Filter users" }), { target: { value: "esther" } });
    await waitFor(() => expect(where()).toBe("/settings/users?sort=role&dir=desc&q=esther"), wait);
    await waitFor(() => expect(emails()).toEqual([esther.email]), wait);

    fireEvent.change(screen.getByRole("textbox", { name: "Filter users" }), { target: { value: "" } });
    await waitFor(() => expect(emails()).toHaveLength(users.length), wait);
    fireEvent.click(screen.getByRole("button", { name: /Role/ }));
    expect(where()).toBe("/settings/users?sort=role&dir=asc");
    await waitFor(() => expect(emails()).toEqual([amy.email, sizwe.email, esther.email, vikram.email]), wait);
  });

  it("schedules a deletion from the row's Delete once the email is typed, then cancels it from the row", async () => {
    renderAt("/settings/users?q=e");
    const edit = await screen.findByRole("link", { name: "Edit Esther Editor" }, wait);
    expect(edit.getAttribute("href")).toBe(`/settings/users/${esther.id}?q=e`);
    fireEvent.click(screen.getByRole("link", { name: "Delete Esther Editor" }));
    expect(where()).toBe(`/settings/users/${esther.id}/delete?q=e`);
    await screen.findByRole("dialog", {}, wait);
    scheduleEsther();
    expect(await screen.findByText("User scheduled for deletion", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(where()).toBe("/settings/users?q=e");
    shown(esther.email, "Disabled", /^Deletes /);

    fireEvent.click(screen.getByRole("button", { name: "Cancel deletion of Esther Editor" }));
    expect(await screen.findByText("User deletion canceled", {}, wait)).toBeTruthy();
    shown(esther.email, "Enabled");
    expect(within(rowOf(esther.email)).queryByText(/^Deletes /)).toBeNull();
  });

  it("keeps the dialog open with the server's reason when it refuses the deletion", async () => {
    failNext("DELETE /api/users/:id", { status: 409, code: "scheduled_for_deletion", detail: "This account is already scheduled for deletion." });
    renderAt(`/settings/users/${esther.id}/delete`);
    await screen.findByRole("dialog", {}, wait);
    scheduleEsther();
    expect(await within(dialog()).findByText("This account is already scheduled for deletion.", {}, wait)).toBeTruthy();
    expect(where()).toBe(`/settings/users/${esther.id}/delete`);
  });

  it("toasts a refused cancel with the server's reason", async () => {
    await request("DELETE", `/api/users/${esther.id}`);
    failNext("DELETE /api/users/:id/scheduled_deletion", { status: 404, code: "not_found", detail: "This user isn't scheduled for deletion." });
    renderAt();
    fireEvent.click(await screen.findByRole("button", { name: "Cancel deletion of Esther Editor" }, wait));
    const alert = await screen.findByRole("alert", {}, wait);
    expect(alert.textContent).toContain("This user isn't scheduled for deletion.");
  });

  it("shows Delete now disabled in a scheduled user's menu, with why, and Delete disabled on a superuser's row", async () => {
    await request("DELETE", `/api/users/${esther.id}`);
    renderAt();
    expect(isDisabled(await screen.findByRole("button", { name: "Delete Sizwe Super" }, wait))).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "More actions for Esther Editor" }));
    const item = within(screen.getByRole("menu")).getByRole("menuitem", { name: /Delete now/ });
    expect(item.getAttribute("aria-disabled")).toBe("true");
    expect(item.textContent).toContain("Not available in the API yet");
  });

  // Each search keeps a user on the loaded page, so only the rule named sends the dialog away.
  it.each([
    ["a user not on the loaded page", esther.id, "viewer", vikram.email, false],
    ["a superuser", sizwe.id, "super", sizwe.email, false],
    ["a user already scheduled", esther.id, "editor", esther.email, true],
  ])("sends the delete dialog of %s to the list", async (_case, id, q, shownEmail, scheduled) => {
    if (scheduled) await request("DELETE", `/api/users/${esther.id}`);
    renderAt(`/settings/users/${id}/delete?q=${q}`);
    await screen.findByText(shownEmail, {}, wait);
    await waitFor(() => expect(where()).toBe(`/settings/users?q=${q}`), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows No Access to someone who isn't a superuser", async () => {
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: esther.email, password: FAKE_PASSWORD });
    renderAt();
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
  });

  describe("the user form", () => {
    const form = () => within(dialog());
    // Required fields have a star after their label.
    const labelled = (label: string) => form().getByLabelText(new RegExp(`^${label}`));
    const type = (label: string, value: string) => fireEvent.change(labelled(label), { target: { value } });
    const openAt = async (path: string) => {
      renderAt(path);
      await within(await screen.findByRole("dialog", {}, wait)).findByLabelText(/^First name/, {}, wait);
    };
    const newUser = async ({ email = "emmy@example.com", password = "a long enough password", support = false } = {}) => {
      await openAt("/settings/users/new?sort=role");
      type("First name", "Emmy");
      type("Last name", "Noether");
      type("Email", email);
      type("Password", password);
      if (support) fireEvent.click(form().getByRole("checkbox", { name: "Support user" }));
      fireEvent.click(form().getByRole("button", { name: "Create user" }));
    };
    const signsInWith = async (email: string, password: string) => {
      await request("DELETE", "/api/session");
      return request("POST", "/api/session", { email, password }).then(
        () => true,
        () => false
      );
    };

    it("creates a user through /new, back on the list with its query, which has reloaded with them", async () => {
      await newUser();
      expect(await screen.findByText("User created successfully", {}, wait)).toBeTruthy();
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(where()).toBe("/settings/users?sort=role");
      shown("emmy@example.com", "Emmy Noether", "User", "Enabled");
      expect(await signsInWith("emmy@example.com", "a long enough password")).toBe(true);
    });

    it("creates a user with support access when Support user is ticked", async () => {
      await newUser({ support: true });
      expect(await screen.findByText("User created successfully", {}, wait)).toBeTruthy();
      shown("emmy@example.com", "Support");
    });

    it("goes back to the list with an error toast when the user is created but support access isn't turned on", async () => {
      failNext("PATCH /api/users/:id", { status: 403, code: "forbidden", detail: "You are not allowed to do that." });
      await newUser({ support: true });
      const alert = await screen.findByRole("alert", {}, wait);
      expect(alert.textContent).toContain("User created, but support access wasn't turned on. You are not allowed to do that.");
      expect(where()).toBe("/settings/users?sort=role");
      expect(await screen.findByText("emmy@example.com", {}, wait)).toBeTruthy();
      expect(within(rowOf("emmy@example.com")).queryByText("Support")).toBeNull();
    });

    it.each([
      ["an email someone has under Email", { email: esther.email.toUpperCase() }, "Email", "has already been taken"],
      ["a short password under Password", { password: "too short" }, "Password", "should be at least 12 character(s)"],
    ])("keeps the form open with the server's refusal of %s", async (_case, values, label, message) => {
      await newUser(values);
      await waitFor(() => expect(labelled(label).getAttribute("aria-invalid")).toBe("true"), wait);
      expect(form().getByText(message)).toBeTruthy();
      expect(where()).toBe("/settings/users/new?sort=role");
    });

    it("changes another user's name, role and Disabled through /:userId", async () => {
      await openAt(`/settings/users/${vikram.id}?q=v`);
      expect(screen.getByRole("heading", { name: "Edit Vikram Viewer" })).toBeTruthy();
      type("Last name", "Varma");
      await pickOption(form().getByRole("button", { name: /^Role/ }), "Superuser");
      fireEvent.click(form().getByRole("checkbox", { name: "Disabled" }));
      fireEvent.click(form().getByRole("button", { name: "Save" }));
      expect(await screen.findByText("User updated successfully", {}, wait)).toBeTruthy();
      expect(where()).toBe("/settings/users?q=v");
      shown(vikram.email, "Vikram Varma", "Superuser", "Disabled");
    });

    it.each([
      ["keeps their password when it's left blank", "", FAKE_PASSWORD],
      ["sets a new password when one is typed", "a brand new password", "a brand new password"],
    ])("%s", async (_case, typed, signsInWithPassword) => {
      await openAt(`/settings/users/${esther.id}`);
      type("Password", typed);
      fireEvent.click(form().getByRole("button", { name: "Save" }));
      expect(await screen.findByText("User updated successfully", {}, wait)).toBeTruthy();
      expect(await signsInWith(esther.email, signsInWithPassword)).toBe(true);
    });

    it("on your own account, greys what you can't change here and saves your name", async () => {
      await openAt(`/settings/users/${amy.id}`);
      expect(form().queryByLabelText("Password")).toBeNull();
      for (const control of [labelled("Email"), form().getByRole("button", { name: /^Role/ }), form().getByRole("checkbox", { name: "Support user" }), form().getByRole("checkbox", { name: "Disabled" })]) {
        expect(isDisabled(control)).toBe(true);
      }
      expect(form().getByText("You can't change your own role.")).toBeTruthy();
      type("Last name", "Adams");
      fireEvent.click(form().getByRole("button", { name: "Save" }));
      expect(await screen.findByText("User updated successfully", {}, wait)).toBeTruthy();
      expect(rowOf(amy.email).textContent).toContain("Amy Adams (you)");
    });

    it("shows a refusal to demote the last superuser under Role", async () => {
      failNext("PATCH /api/users/:id", {
        status: 422,
        code: "invalid",
        detail: "The request body is not valid.",
        errors: [{ code: "last_superuser", detail: "would leave this instance with no superuser", pointer: "#/role" }],
      });
      await openAt(`/settings/users/${sizwe.id}`);
      await pickOption(form().getByRole("button", { name: /^Role/ }), "User");
      fireEvent.click(form().getByRole("button", { name: "Save" }));
      await waitFor(() => expect(form().getByRole("button", { name: /^Role/ }).getAttribute("aria-invalid")).toBe("true"), wait);
      expect(form().getByText("would leave this instance with no superuser")).toBeTruthy();
    });

    it("shows a refusal that isn't about a field in the form, which stays open", async () => {
      failNext("PATCH /api/users/:id", { status: 403, code: "forbidden", detail: "You are not allowed to do that." });
      await openAt(`/settings/users/${esther.id}`);
      fireEvent.click(form().getByRole("button", { name: "Save" }));
      const refusal = await form().findByText("You are not allowed to do that.", {}, wait);
      expect(refusal.closest("[role=alert]")?.textContent).toContain("The account wasn't saved");
      expect(where()).toBe(`/settings/users/${esther.id}`);
    });

    it("sends an unknown /:userId to the list, keeping its query", async () => {
      renderAt("/settings/users/no-such-user?q=e");
      await waitFor(() => expect(where()).toBe("/settings/users?q=e"), wait);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("goes back to the list with its query on Cancel, saving nothing", async () => {
      await openAt(`/settings/users/${esther.id}?sort=role&dir=desc`);
      type("Last name", "Unsaved");
      fireEvent.click(form().getByRole("button", { name: "Cancel" }));
      expect(where()).toBe("/settings/users?sort=role&dir=desc");
      expect(screen.queryByRole("dialog")).toBeNull();
      // A save sent on Cancel would land before this answer: the fake answers in order.
      const { data } = await request<{ data: { attributes: { last_name: string } } }>("GET", `/api/users/${esther.id}`);
      expect(data.attributes.last_name).toBe("Editor");
    });

    it("opens an account as it is now, not as it was the last time its form was open", async () => {
      await openAt(`/settings/users/${esther.id}`);
      fireEvent.click(form().getByRole("button", { name: "Cancel" }));
      await request("DELETE", `/api/users/${esther.id}`);
      fireEvent.click(screen.getByRole("link", { name: "Edit Esther Editor" }));
      const disabled = await within(await screen.findByRole("dialog", {}, wait)).findByRole("checkbox", { name: "Disabled" }, wait);
      expect((disabled as HTMLInputElement).checked).toBe(true);
    });

    it("shows No Access in the form when the server refuses someone who isn't a superuser the account", async () => {
      await signsInWith(esther.email, FAKE_PASSWORD);
      renderAt(`/settings/users/${vikram.id}`);
      expect(await within(await screen.findByRole("dialog", {}, wait)).findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
    });
  });
});

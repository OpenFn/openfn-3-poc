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
});

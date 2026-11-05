import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import CredentialsIndexPageQuery from "./CredentialsIndexPage.query";

const wait = { timeout: 3000 };

function renderRoute() {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/credentials"]}>
            <ReactRouterAdapter>
              <Routes>
                <Route path="/credentials" element={<CredentialsIndexPageQuery />} />
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

const row = (name: string) => screen.getByRole("row", { name: new RegExp(name) });
const choose = async (name: string, item: string) => {
  await userEvent.click(within(await screen.findByRole("row", { name: new RegExp(name) }, wait)).getByRole("button", { name: `Actions for ${name}` }));
  await userEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: new RegExp(`^${item}`) }));
};
const dialog = () => screen.findByRole("dialog", {}, wait);
const notice = (text: string) => screen.findByText(text, {}, wait);

// Each test drives menus and dialogs through several requests to the fake server.
describe("CredentialsIndexPageQuery", { timeout: 15_000 }, () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer. With fake timers and a `jest`
    // global, Testing Library moves the clock on while it waits, so those waits are instant.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the viewer's own credentials, and their own and the global OAuth clients", async () => {
    renderRoute();
    await screen.findByRole("row", { name: /DHIS2 play/ }, wait);
    expect(within(row("Reporting spreadsheet")).getByText("Transfer pending")).toBeTruthy();
    expect(within(row("OpenHIE HAPI FHIR")).getByText("staging")).toBeTruthy();
    // Esther's, shared with a project Amy is in: not hers, so not listed.
    expect(screen.queryByRole("row", { name: /CommCare HQ/ })).toBeNull();
    expect(await screen.findByRole("row", { name: /Google Workspace/ }, wait)).toBeTruthy();
    expect(within(row("Salesforce")).getByText("Global")).toBeTruthy();
  });

  it("shows the server's message in each table's place when the lists fail to load", async () => {
    failNext("GET /api/credentials", { status: 500, code: "internal", detail: "Lightning couldn't list credentials." });
    failNext("GET /api/oauth_clients", { status: 500, code: "internal", detail: "Lightning couldn't list OAuth clients." });
    renderRoute();
    expect(await notice("Lightning couldn't list credentials.")).toBeTruthy();
    expect(await notice("Lightning couldn't list OAuth clients.")).toBeTruthy();
  });

  it("schedules a deletion, which unshares the credential, and cancels it again", async () => {
    renderRoute();
    await choose("DHIS2 play", "Delete");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Delete credential" }));
    expect(await notice("Credential scheduled for deletion")).toBeTruthy();
    await waitFor(() => expect(within(row("DHIS2 play")).getByText("Scheduled for deletion")).toBeTruthy(), wait);
    expect(within(row("DHIS2 play")).getByText("None")).toBeTruthy();

    await choose("DHIS2 play", "Cancel deletion");
    expect(await notice("Credential deletion canceled")).toBeTruthy();
    await waitFor(() => expect(within(row("DHIS2 play")).queryByText("Scheduled for deletion")).toBeNull(), wait);
    // The projects it lost stay lost.
    expect(within(row("DHIS2 play")).getByText("None")).toBeTruthy();
  });

  it("deletes a scheduled credential now, and the row goes", async () => {
    await request("PUT", "/api/credentials/cred-dhis2-play/scheduled_deletion");
    renderRoute();
    await choose("DHIS2 play", "Delete now");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Delete credential" }));
    expect(await notice('"DHIS2 play" deleted')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("row", { name: /DHIS2 play/ })).toBeNull(), wait);
    // Its menu went with it, so focus goes to the section's create button.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "New credential" })), wait);
  });

  it("explains, and deletes nothing, when runs have used a scheduled credential", async () => {
    renderRoute();
    await choose("Legacy warehouse", "Delete now");
    expect(within(await dialog()).getByText("Credential marked for deletion")).toBeTruthy();
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Delete credential" })).toBeNull();
  });

  it("keeps the delete dialog open when the server refuses to delete a credential runs have used", async () => {
    await request("PUT", "/api/credentials/cred-dhis2-play/scheduled_deletion");
    failNext("DELETE /api/credentials/:id", { status: 409, code: "in_use", detail: "Cannot delete a credential that has activities in projects" });
    renderRoute();
    await choose("DHIS2 play", "Delete now");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Delete credential" }));
    expect(await within(screen.getByRole("dialog")).findByText("Cannot delete a credential that has activities in projects", {}, wait)).toBeTruthy();
    expect(screen.getByRole("row", { name: /DHIS2 play/ })).toBeTruthy();
  });

  it("starts a transfer, which shows as pending, and puts a refusal on the email field", async () => {
    renderRoute();
    await choose("DHIS2 play", "Transfer");
    const email = within(await dialog()).getByLabelText("Receiver email");
    await userEvent.type(email, "nobody@example.org");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Transfer" }));
    expect(await within(screen.getByRole("dialog")).findByText("They need an account and a role in every project this credential is shared with", {}, wait)).toBeTruthy();

    await userEvent.clear(email);
    await userEvent.type(email, "editor@openfn.org");
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Transfer" }));
    expect(await notice("Credential transfer initiated. We've sent you a confirmation email.")).toBeTruthy();
    await waitFor(() => expect(within(row("DHIS2 play")).getByText("Transfer pending")).toBeTruthy(), wait);
  });

  it("revokes a pending transfer", async () => {
    renderRoute();
    await choose("Reporting spreadsheet", "Revoke transfer");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Revoke" }));
    expect(await notice("Transfer revoked successfully")).toBeTruthy();
    await waitFor(() => expect(within(row("Reporting spreadsheet")).queryByText("Transfer pending")).toBeNull(), wait);
  });

  it("creates a raw credential, and lists it", async () => {
    renderRoute();
    await screen.findByRole("row", { name: /DHIS2 play/ }, wait);
    await userEvent.click(screen.getByRole("button", { name: "New credential" }));
    fireEvent.click(within(await dialog()).getByLabelText(/Raw JSON/));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Configure credential" }));
    await screen.findByRole("button", { name: "Save Credential" }, wait);
    fireEvent.change(screen.getByLabelText(/^Credential Name/), { target: { value: "Mailchimp" } });
    fireEvent.change(screen.getByLabelText(/^Credential Body/), { target: { value: '{"apiKey":"abc"}' } });
    fireEvent.click(screen.getByRole("button", { name: "Save Credential" }));
    expect(await notice("Credential created successfully")).toBeTruthy();
    expect(await screen.findByRole("row", { name: /Mailchimp/ }, wait)).toBeTruthy();
  });

  it("saves an edit, and lists the new name", async () => {
    renderRoute();
    await choose("DHIS2 play", "Edit");
    fireEvent.change(within(await dialog()).getByLabelText(/^Credential Name/), { target: { value: "DHIS2 sandbox" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Credential" }));
    expect(await notice("Credential updated successfully")).toBeTruthy();
    expect(await screen.findByRole("row", { name: /DHIS2 sandbox/ }, wait)).toBeTruthy();
  });

  it("puts the server's refusal of a taken name on the credential form's name field", async () => {
    renderRoute();
    await choose("DHIS2 play", "Edit");
    fireEvent.change(within(await dialog()).getByLabelText(/^Credential Name/), { target: { value: "OpenHIE HAPI FHIR" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Credential" }));
    expect(await within(screen.getByRole("dialog")).findByText("has already been taken", {}, wait)).toBeTruthy();
  });

  it("creates an OAuth client, and lists it", async () => {
    renderRoute();
    await screen.findByRole("row", { name: /Google Workspace/ }, wait);
    await userEvent.click(screen.getByRole("button", { name: "New OAuth client" }));
    const form = within(await dialog());
    fireEvent.change(form.getByLabelText(/^Name/), { target: { value: "Mailchimp app" } });
    fireEvent.change(form.getByLabelText(/^Authorization Endpoint/), { target: { value: "https://login.mailchimp.com/oauth2/authorize" } });
    fireEvent.change(form.getByLabelText(/^Token Endpoint/), { target: { value: "https://login.mailchimp.com/oauth2/token" } });
    fireEvent.change(form.getByLabelText(/^Client ID/), { target: { value: "mc-id" } });
    fireEvent.change(form.getByLabelText(/^Client Secret/), { target: { value: "mc-secret" } });
    fireEvent.click(form.getByRole("button", { name: "Add OAuth Client" }));
    expect(await notice("OAuth client created successfully")).toBeTruthy();
    expect(await screen.findByRole("row", { name: /Mailchimp app/ }, wait)).toBeTruthy();
  });

  it("renames an OAuth client without asking for its secret again", async () => {
    renderRoute();
    await choose("Google Workspace", "Edit");
    fireEvent.change(within(await dialog()).getByLabelText(/^Name/), { target: { value: "Google" } });
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Save Changes" }));
    expect(await notice("OAuth client updated successfully")).toBeTruthy();
    expect(await screen.findByRole("row", { name: /^Google / }, wait)).toBeTruthy();
  });

  it("deletes an OAuth client after asking", async () => {
    renderRoute();
    await choose("Google Workspace", "Delete");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Delete OAuth client" }));
    expect(await notice('"Google Workspace" deleted')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole("row", { name: /Google Workspace/ })).toBeNull(), wait);
  });

  it("puts the server's refusal of an OAuth client field on that field", async () => {
    failNext("PUT /api/oauth_clients/:id", {
      status: 422,
      code: "invalid",
      detail: "The request body is not valid.",
      errors: [{ code: "format", detail: "must be a valid URL", pointer: "#/token_endpoint" }],
    });
    renderRoute();
    await choose("Google Workspace", "Edit");
    await userEvent.click(within(await dialog()).getByRole("button", { name: "Save Changes" }));
    const field = within(screen.getByRole("dialog")).getByLabelText(/^Token Endpoint/);
    await waitFor(() => expect(field.getAttribute("aria-invalid")).toBe("true"), wait);
    expect(within(screen.getByRole("dialog")).getByText("must be a valid URL")).toBeTruthy();
  });
});

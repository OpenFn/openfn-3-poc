import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import type { CredentialRow, OauthClientRow } from "@/types/credentials";
import { RequestError } from "@/utils/errors";
import CredentialsIndexPage, { type CredentialsIndexPageProps } from "./CredentialsIndexPage";

const dhis2: CredentialRow = {
  id: "cred1",
  name: "DHIS2 play",
  schema: "dhis2",
  oauthClient: null,
  ownerEmail: "amy@example.org",
  projects: [{ id: "p1", name: "openhie", workflowsUsing: [] }],
  externalId: "dhis2-01",
  environments: ["main", "staging"],
  transferStatus: null,
  scheduledDeletion: null,
  hasActivityInProjects: false,
  canEdit: true,
};
const pending: CredentialRow = { ...dhis2, id: "cred2", name: "Pending one", schema: "raw", externalId: null, projects: [], environments: ["main"], transferStatus: "pending" };
const scheduled: CredentialRow = { ...pending, id: "cred3", name: "Old warehouse", transferStatus: null, scheduledDeletion: "2026-11-12T09:00:00Z" };
const sheets: CredentialRow = { ...pending, id: "cred4", name: "Sheets", schema: "oauth", transferStatus: null, oauthClient: { id: "oc1", name: "Google", mandatoryScopes: [], optionalScopes: [], scopesDocUrl: "" } };
const google: OauthClientRow = {
  id: "oc1",
  name: "Google",
  clientId: "google-client-id",
  ownerEmail: "amy@example.org",
  global: false,
  projects: [{ id: "p1", name: "openhie" }],
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "",
  introspectionEndpoint: "",
  userinfoEndpoint: "",
  mandatoryScopes: ["openid"],
  optionalScopes: [],
  scopesDocUrl: "",
  canEdit: true,
};
const salesforce: OauthClientRow = { ...google, id: "oc2", name: "Salesforce", global: true, projects: [], ownerEmail: "", canEdit: false };

const actions = [
  "onCreateCredential",
  "onUpdateCredential",
  "onLoadCredentialSchema",
  "onDeleteCredential",
  "onCancelCredentialDeletion",
  "onTransferCredential",
  "onRevokeCredentialTransfer",
  "onCreateOauthClient",
  "onUpdateOauthClient",
  "onDeleteOauthClient",
] as const;
const render = (data: Partial<Omit<CredentialsIndexPageProps, (typeof actions)[number]>> = {}) =>
  renderPage(
    CredentialsIndexPage,
    { credentials: [dhis2, pending, scheduled, sheets], oauthClients: [google, salesforce], projects: [{ id: "p1", name: "openhie" }], credentialTypes: [], canCreateGlobalOauthClient: false, ...data },
    [...actions]
  );

const row = (name: string) => screen.getByRole("row", { name: new RegExp(name) });
const menu = async (name: string) => {
  await userEvent.click(within(row(name)).getByRole("button", { name: `Actions for ${name}` }));
  return screen.getByRole("menu");
};
const choose = async (name: string, item: string) => userEvent.click(within(await menu(name)).getByRole("menuitem", { name: new RegExp(`^${item}`) }));

describe("CredentialsIndexPage", () => {
  it("shows each credential's type, projects, environments and what's pending on it", () => {
    render();
    expect(within(row("DHIS2 play")).getByText("dhis2-01")).toBeTruthy();
    expect(within(row("DHIS2 play")).getByText("openhie")).toBeTruthy();
    expect(within(row("DHIS2 play")).getByText("staging")).toBeTruthy();
    expect(within(row("Pending one")).getByText("Transfer pending")).toBeTruthy();
    expect(within(row("Pending one")).getByText("None")).toBeTruthy();
    expect(within(row("Old warehouse")).getByText("Scheduled for deletion")).toBeTruthy();
    expect(within(row("Sheets")).getByText("google")).toBeTruthy();
  });

  it("shows the OAuth clients, global ones as Global with no menu", () => {
    render();
    expect(within(row("Salesforce")).getByText("Global")).toBeTruthy();
    expect(within(row("Salesforce")).queryByRole("button")).toBeNull();
    expect(within(row("Google")).getByRole("button", { name: "Actions for Google" })).toBeTruthy();
  });

  it("says what each list is for when it's empty", () => {
    render({ credentials: [], oauthClients: [] });
    expect(screen.getByText("No credentials yet")).toBeTruthy();
    expect(screen.getByText("No OAuth clients yet")).toBeTruthy();
  });

  it("offers only Cancel deletion and Delete now on a scheduled credential", async () => {
    render();
    const items = within(await menu("Old warehouse")).getAllByRole("menuitem").map((i) => i.textContent);
    expect(items).toEqual(["Cancel deletion", "Delete now"]);
  });

  it("keeps Edit on an OAuth credential, disabled, saying why", async () => {
    render();
    const edit = within(await menu("Sheets")).getByRole("menuitem", { name: /^Edit/ });
    expect(edit.getAttribute("aria-disabled")).toBe("true");
    expect(edit.textContent).toContain("OAuth credentials can't be edited here yet.");
  });

  it("loads an adaptor's fields before editing, and shows none of the saved values", async () => {
    const host = render();
    await choose("DHIS2 play", "Edit");
    expect(host.calls("onLoadCredentialSchema")).toEqual([["dhis2"]]);
    await host.resolve("onLoadCredentialSchema", {
      fields: [{ key: "password", label: "Password", kind: "password", required: false, placeholder: null, unrecognizedType: null }],
    });
    const form = screen.getByRole("dialog");
    expect((within(form).getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it("refuses, without saving, an environment added on edit", async () => {
    const host = render();
    await choose("DHIS2 play", "Edit");
    await host.resolve("onLoadCredentialSchema", { fields: [] });
    const form = screen.getByRole("dialog");
    await userEvent.click(within(form).getByRole("button", { name: "Add new environment" }));
    await userEvent.click(within(form).getByRole("button", { name: /Save/ }));
    expect(await within(form).findByText(/Environments can't be added, renamed or removed here yet/)).toBeTruthy();
    expect(host.calls("onUpdateCredential")).toEqual([]);
  });

  it("shows the result above the table only once the server has scheduled the deletion", async () => {
    const host = render();
    await choose("DHIS2 play", "Delete");
    await userEvent.click(screen.getByRole("button", { name: "Delete credential" }));
    expect(host.calls("onDeleteCredential")).toEqual([["cred1", { now: false }]]);
    expect(screen.queryByText("Credential scheduled for deletion")).toBeNull();
    await host.resolve("onDeleteCredential");
    expect(screen.getByText("Credential scheduled for deletion")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels a deletion from the menu, and toasts a refusal", async () => {
    const host = render();
    await choose("Old warehouse", "Cancel deletion");
    await host.reject("onCancelCredentialDeletion", new RequestError("This credential isn't scheduled for deletion."));
    expect(screen.getByText("This credential isn't scheduled for deletion.")).toBeTruthy();
    expect(screen.queryByText("Credential deletion canceled")).toBeNull();
  });

  it("edits an OAuth client without its saved secret, which a blank field keeps", async () => {
    const host = render();
    await choose("Google", "Edit");
    const form = screen.getByRole("dialog");
    expect((within(form).getByLabelText(/^Client ID/) as HTMLInputElement).value).toBe("google-client-id");
    expect(within(form).getByText("Saved. Leave blank to keep it.")).toBeTruthy();
    await userEvent.click(within(form).getByRole("button", { name: "Save Changes" }));
    expect(host.calls("onUpdateOauthClient")[0]?.[1]).toMatchObject({ clientId: "google-client-id", clientSecret: "" });
    await host.resolve("onUpdateOauthClient");
    expect(screen.getByText("OAuth client updated successfully")).toBeTruthy();
  });
});

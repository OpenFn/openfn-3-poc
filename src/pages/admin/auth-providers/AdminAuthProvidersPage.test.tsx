import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import type { AuthProvider } from "@/types/admin";
import AdminAuthProvidersPage from "./AdminAuthProvidersPage";

const existing: AuthProvider = {
  name: "google",
  discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
  clientId: "client-id",
  redirectUri: "http://localhost:4000/authenticate/google/callback",
};

const render = (provider: AuthProvider | null = null) =>
  renderPage(AdminAuthProvidersPage, { provider, instanceUrl: "http://localhost:4000" }, ["onSave", "onRemove"]);

const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));
// Labels carry a required star, so match on their text.
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;
const type = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
const redirectUri = () => screen.getByText(/\/authenticate\//).textContent;

describe("AdminAuthProvidersPage", () => {
  it("with no provider, says so, and Save on the blank form says what is missing without saving or disabling Save", () => {
    const host = render();
    expect(screen.getByText("No provider set up")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(redirectUri()).toBe("http://localhost:4000/authenticate/…/callback");
    save();
    expect(screen.getAllByText("can't be blank")).toHaveLength(4);
    expect(document.activeElement).toBe(field("Name"));
    expect(screen.getByRole("button", { name: "Save" }).hasAttribute("disabled")).toBe(false);
    expect(host.calls("onSave")).toEqual([]);
  });

  it("sets one up with the API's field names, the redirect URI following the name, and toasts once the host has it", async () => {
    const host = render();
    type("Name", "keycloak");
    expect(redirectUri()).toBe("http://localhost:4000/authenticate/keycloak/callback");
    type("Discovery URL", "https://sso.example.org/.well-known/openid-configuration");
    type("Client ID", "lightning");
    type("Client secret", "s3cret");
    save();
    expect(host.calls("onSave")).toEqual([
      [{ name: "keycloak", discovery_url: "https://sso.example.org/.well-known/openid-configuration", client_id: "lightning", client_secret: "s3cret" }],
    ]);
    expect(screen.getByRole("button", { name: /Save/ }).getAttribute("aria-busy")).toBe("true");
    expect(screen.queryByText("Authentication Provider created.")).toBeNull();
    await host.resolve("onSave");
    expect(screen.getByText("Authentication Provider created.")).toBeTruthy();
  });

  it("edits a provider without its secret, which may stay blank and is blank again after a save", async () => {
    const host = render(existing);
    expect(screen.queryByText("No provider set up")).toBeNull();
    expect(field("Name").value).toBe("google");
    expect(field("Client secret").value).toBe("");
    expect(field("Client secret").placeholder).toBe("Stored; type to replace it");
    expect(screen.getByText("Leave blank to keep the secret that's stored.")).toBeTruthy();
    save();
    expect(host.calls("onSave")).toEqual([[expect.objectContaining({ client_id: "client-id", client_secret: "" })]]);
    await host.resolve("onSave");
    expect(screen.getByText("Authentication Provider updated.")).toBeTruthy();

    type("Client secret", "new-secret");
    save();
    await host.resolve("onSave");
    expect(field("Client secret").value).toBe("");
  });

  it("removes only once confirmed, then starts a blank form with focus on Name", async () => {
    const host = render(existing);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    const dialog = screen.getByRole("dialog", { name: "Remove authentication provider" });
    expect(within(dialog).getByText(/Single sign-on through google stops straight away/)).toBeTruthy();
    expect(host.calls("onRemove")).toEqual([]);
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove provider" }));
    expect(within(dialog).getByRole("button", { name: /Remove provider/ }).getAttribute("aria-busy")).toBe("true");
    // The host has reloaded the provider by the time it answers.
    host.sendProps({ provider: null });
    await host.resolve("onRemove");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("Authentication Provider removed")).toBeTruthy();
    expect(field("Name").value).toBe("");
    expect(document.activeElement).toBe(field("Name"));
  });
});

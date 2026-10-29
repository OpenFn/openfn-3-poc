import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "../../test/renderPage";
import type { AuthProvider } from "../../types/admin";
import { RequestError } from "../../utils/errors";
import AdminAuthProvidersPage from "./AdminAuthProvidersPage";

const blank: AuthProvider = {
  id: null,
  name: "",
  discoveryUrl: "",
  clientId: "",
  hasClientSecret: false,
  redirectHost: "http://localhost:4000",
  allowUnverifiedEmail: false,
};

const existing: AuthProvider = {
  id: "ap1",
  name: "google",
  discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
  clientId: "client-id",
  hasClientSecret: true,
  redirectHost: "http://localhost:4000",
  allowUnverifiedEmail: false,
};

const render = (provider = blank) => renderPage(AdminAuthProvidersPage, { provider }, ["onSave", "onTest", "onRemove"]);

const save = () => screen.getByRole("button", { name: "Save" });
// Labels may carry a hint, so match on their text.
const field = (label: string) => screen.getByLabelText(new RegExp(label)) as HTMLInputElement;
const type = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
const fillAll = () => {
  type("Name", "google");
  type("Discovery URL", "https://accounts.google.com/.well-known/openid-configuration");
  type("Client ID", "client-id");
  type("Client Secret", "s3cret");
};

describe("AdminAuthProvidersPage", () => {
  it("starts blank with no Test and no Remove, and previews the host", () => {
    render();
    expect(screen.getByRole("heading", { name: "Authentication" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Test" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(document.getElementById("redirect-uri-preview")!.textContent).toBe("http://localhost:4000…");
    expect(field("Trust unverified emails from this provider").checked).toBe(false);
  });

  it("keeps Save enabled, and pressing it on a blank form says what is missing without saving", () => {
    const host = render();
    expect(save().hasAttribute("disabled")).toBe(false);
    fireEvent.click(save());
    expect(screen.getAllByText("can't be blank")).toHaveLength(4);
    expect(host.calls("onSave")).toEqual([]);
  });

  it("offers Test once every field is filled, and previews the redirect URI", () => {
    const host = render();
    fillAll();
    expect(screen.getByRole("button", { name: "Test" })).toBeTruthy();
    expect(document.getElementById("redirect-uri-preview")!.textContent).toBe("http://localhost:4000/authenticate/google/callback");

    fireEvent.click(field("Trust unverified emails from this provider"));
    fireEvent.submit(document.getElementById("auth-provider-form")!);
    expect(host.calls("onSave")).toEqual([
      [
        {
          name: "google",
          discoveryUrl: "https://accounts.google.com/.well-known/openid-configuration",
          clientId: "client-id",
          clientSecret: "s3cret",
          redirectHost: "http://localhost:4000",
          allowUnverifiedEmail: true,
        },
      ],
    ]);
  });

  it("shows a passing test, a failing one with its reason, and forgets both on an edit", async () => {
    const host = render();
    fillAll();
    fireEvent.click(screen.getByRole("button", { name: "Test" }));
    await host.reject("onTest", new RequestError("error parsing .well-known"));
    expect(screen.getByRole("button", { name: "Failed" })).toBeTruthy();
    expect(screen.getByText("error parsing .well-known")).toBeTruthy();

    type("Discovery URL", "https://accounts.google.com/.well-known/openid-configuration2");
    expect(screen.queryByText("error parsing .well-known")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Test" }));
    await host.resolve("onTest");
    expect(screen.getByRole("button", { name: "Success" })).toBeTruthy();
    expect(host.calls("onTest")).toHaveLength(2);

    type("Client ID", "other");
    expect(screen.getByRole("button", { name: "Test" })).toBeTruthy();
  });

  it("edits an existing provider without its secret, which may be left blank", () => {
    const host = render(existing);
    expect(field("Name").value).toBe("google");
    expect(field("Client Secret").value).toBe("");
    expect(field("Client Secret").getAttribute("placeholder")).toContain("keep the current secret");
    expect(save().hasAttribute("disabled")).toBe(false);

    type("Client ID", "new-client-id");
    type("Redirect Host", "http://localhost:3030");
    expect(document.getElementById("redirect-uri-preview")!.textContent).toBe("http://localhost:3030/authenticate/google/callback");
    fireEvent.submit(document.getElementById("auth-provider-form")!);
    expect(host.calls("onSave")).toEqual([[expect.objectContaining({ clientId: "new-client-id", clientSecret: "" })]]);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(host.calls("onRemove")).toEqual([[]]);
  });

  it("says what the host would refuse, and Save sends nothing until it is fixed", () => {
    const host = render();
    fillAll();
    type("Name", "Not Lower");
    expect(screen.getByText(/must be lower-case/)).toBeTruthy();
    fireEvent.click(save());
    expect(host.calls("onSave")).toEqual([]);
    type("Name", "google");
    type("Discovery URL", "acme");
    expect(screen.getByText("must be a valid HTTP/s URL")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Test" })).toBeNull();
  });

  it("shows a refused save or remove in a danger alert", async () => {
    const host = render(existing);
    fireEvent.submit(document.getElementById("auth-provider-form")!);
    await host.reject("onSave", new RequestError("Could not reach the provider."));
    const saveAlert = screen.getByText("Could not reach the provider.");
    expect(saveAlert.closest("[data-ui=alert]")!.getAttribute("data-tone")).toBe("danger");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await host.reject("onRemove", new RequestError("You are not authorized to perform this action."));
    const removeAlert = screen.getByText("You are not authorized to perform this action.");
    expect(removeAlert.closest("[data-ui=alert]")!.getAttribute("data-tone")).toBe("danger");
  });

  it("puts the host's field errors on their fields", async () => {
    const host = render(existing);
    type("Name", "okta");
    fireEvent.submit(document.getElementById("auth-provider-form")!);
    await host.reject("onSave", new RequestError("Please fix the errors below.", { fieldErrors: { name: ["has already been taken"] } }));
    expect(screen.getByText("has already been taken")).toBeTruthy();
  });

  it("keeps what was typed between the host's reply to a create and its new props, then shows the saved provider", async () => {
    const host = render();
    fillAll();
    fireEvent.submit(document.getElementById("auth-provider-form")!);
    await host.resolve("onSave");
    expect(field("Name").value).toBe("google");
    expect(field("Client Secret").value).toBe("s3cret");

    host.sendProps({ provider: existing });
    expect(field("Name").value).toBe("google");
    expect(field("Client Secret").value).toBe("");
    expect(field("Client Secret").getAttribute("placeholder")).toContain("keep the current secret");
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });
});

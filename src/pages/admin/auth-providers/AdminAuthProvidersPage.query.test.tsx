import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { authProvider } from "@/mock-data/admin";
import { users } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AdminAuthProvidersPageQuery from "./AdminAuthProvidersPage.query";

const wait = { timeout: 3000 };

function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path = "/settings/authentication") {
  const page = (
    <>
      <AdminAuthProvidersPageQuery />
      <Path />
    </>
  );
  render(
    <ApiProvider retry={false}>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/settings/authentication" element={page} />
              <Route path="/settings/authentication/new" element={page} />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

const path = () => screen.getByTestId("path").textContent;
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;
const type = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save" }));
const loaded = () => screen.findByRole("button", { name: "Save" }, wait);
const removeProvider = () => request("DELETE", "/api/auth_provider");

describe("AdminAuthProvidersPageQuery", () => {
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

  it("loads the provider on /settings/authentication, with its redirect URI and no secret", async () => {
    renderAt();
    await loaded();
    expect(field("Name").value).toBe(authProvider.name);
    expect(field("Discovery URL").value).toBe(authProvider.discoveryUrl);
    expect(field("Client ID").value).toBe(authProvider.clientId);
    expect(field("Client secret").value).toBe("");
    expect(screen.getByText(authProvider.redirectUri)).toBeTruthy();
    expect(path()).toBe("/settings/authentication");
  });

  it("with no provider, goes from /settings/authentication to /new, with the blank form and the notice", async () => {
    await removeProvider();
    renderAt();
    await loaded();
    expect(path()).toBe("/settings/authentication/new");
    expect(screen.getByText("No provider set up")).toBeTruthy();
    expect(field("Name").value).toBe("");
  });

  it("with a provider, goes from /new back to /settings/authentication", async () => {
    renderAt("/settings/authentication/new");
    await loaded();
    expect(path()).toBe("/settings/authentication");
    expect(field("Name").value).toBe(authProvider.name);
  });

  it("sets one up and lands on /settings/authentication with the toast", async () => {
    await removeProvider();
    renderAt("/settings/authentication/new");
    await loaded();
    type("Name", "keycloak");
    type("Discovery URL", "https://sso.example.org/realms/main/.well-known/openid-configuration");
    type("Client ID", "lightning");
    type("Client secret", "s3cret");
    screen.getByRole("button", { name: "Save" }).focus();
    save();
    expect(await screen.findByText("Authentication Provider created.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(path()).toBe("/settings/authentication"), wait);
    expect(field("Name").value).toBe("keycloak");
    expect(field("Client secret").value).toBe("");
    // The page stays through the move to the edit route, so focus stays on Save.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByText("No provider set up")).toBeNull();
  });

  it("updates with the secret left blank, which the PUT leaves out (a blank one would be refused)", async () => {
    renderAt();
    await loaded();
    type("Client ID", "new-client");
    save();
    expect(await screen.findByText("Authentication Provider updated.", {}, wait)).toBeTruthy();
    expect(field("Client ID").value).toBe("new-client");
  });

  it("shows a discovery document it can't use under Discovery URL", async () => {
    failNext("PUT /api/auth_provider", {
      status: 422,
      code: "invalid",
      errors: [{ code: "discovery_failed", detail: "could not connect to discovery endpoint", pointer: "#/discovery_url" }],
    });
    renderAt();
    await loaded();
    save();
    const error = await screen.findByText("could not connect to discovery endpoint", {}, wait);
    expect(field("Discovery URL").getAttribute("aria-describedby")).toContain(error.id);
  });

  it("shows the server's format check under Name, keeping what was typed", async () => {
    renderAt();
    await loaded();
    type("Name", "My Provider");
    save();
    const error = await screen.findByText("must be lower-case and only contain alphanumeric, dash and underscore characters", {}, wait);
    expect(field("Name").getAttribute("aria-describedby")).toContain(error.id);
    expect(field("Name").value).toBe("My Provider");
  });

  it("removes it through the dialog and lands on /new with the toast", async () => {
    renderAt();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove provider" }));
    expect(await screen.findByText("Authentication Provider removed", {}, wait)).toBeTruthy();
    await waitFor(() => expect(path()).toBe("/settings/authentication/new"), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("No provider set up")).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(field("Name")), wait);
  });

  it("keeps a refused remove in the dialog with the server's words", async () => {
    renderAt();
    await loaded();
    // Someone else removed it first.
    await removeProvider();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Remove provider" }));
    expect(await within(screen.getByRole("dialog")).findByText("Not found.", {}, wait)).toBeTruthy();
  });

  it("shows No Access to someone who isn't a superuser", async () => {
    const user = users.find((u) => u.role !== "superuser" && !u.mfaEnabled)!;
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: user.email, password: FAKE_PASSWORD });
    renderAt();
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
  });
});

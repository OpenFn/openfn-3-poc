import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import ProjectGate from "@/components/shell/ProjectGate.query";
import { channelsIn } from "@/mock-data/channels";
import { projects } from "@/mock-data/projects";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import { isDisabled } from "@/test/disabled";
import ChannelsIndexPageQuery from "./ChannelsIndexPage.query";

const wait = { timeout: 3000 };
const project = projects[0]!;
const list = `/projects/${project.id}/channels`;
const [shr] = channelsIn(project.id);

function Where() {
  const { pathname } = useLocation();
  return <output data-testid="where">{pathname}</output>;
}

function renderAt(path = list) {
  const page = (
    <>
      <ChannelsIndexPageQuery />
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
                <Route path="/projects/:projectId" element={<ProjectGate />}>
                  <Route path="channels" element={page} />
                  <Route path="channels/new" element={page} />
                  <Route path="channels/:channelId/edit" element={page} />
                </Route>
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

const where = () => screen.getByTestId("where").textContent;
const names = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((row) => row.querySelector("td")?.textContent);
const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const dialog = () => screen.getByRole("dialog");
// Someone else saves the SHR proxy channel after it was listed here.
const saveElsewhere = () =>
  request("PUT", `/api/projects/${project.id}/channels/${shr!.id}`, {
    name: shr!.name,
    destination_url: "https://elsewhere.example.org",
    enabled: shr!.enabled,
    client_auth_method_ids: shr!.clientAuthMethodIds,
    destination_credential_id: shr!.destinationCredentialId,
    lock_version: shr!.lockVersion,
  });
const signInAsViewer = async () => {
  await request("DELETE", "/api/session");
  await request("POST", "/api/session", { email: "viewer@openfn.org", password: FAKE_PASSWORD });
};

describe("ChannelsIndexPageQuery", () => {
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

  it("loads the project's channels by name", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(names()).toEqual(channelsIn(project.id).map((c) => c.name).sort((a, b) => a.localeCompare(b)));
    expect(screen.getByRole("heading", { name: "Channels (3)" })).toBeTruthy();
  });

  it("puts a switch refused for someone else's change back with its message, and switches it off on the next try", async () => {
    renderAt();
    const toggle = await within(await screen.findByRole("table", {}, wait)).findByRole("switch", { name: "SHR proxy" });
    await saveElsewhere();
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(await screen.findByText("Someone else changed this channel since you loaded it. Load it again and retry.", {}, wait)).toBeTruthy();
    await waitFor(() => expect(toggle.getAttribute("aria-checked")).toBe("true"), wait);

    // The refusal reloaded the list, so this try carries the new version.
    fireEvent.click(toggle);
    await waitFor(async () => {
      const answer = await request<{ data: { id: string; attributes: { enabled: boolean } }[] }>("GET", `/api/projects/${project.id}/channels`);
      expect(answer.data.find((c) => c.id === shr!.id)?.attributes.enabled).toBe(false);
    }, wait);
    expect(toggle.getAttribute("aria-checked")).toBe("false");
  });

  it("creates a channel, and shows a taken name under Name", async () => {
    renderAt(`${list}/new`);
    fireEvent.change(await screen.findByLabelText("Name", {}, wait), { target: { value: "SHR proxy" } });
    fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.org/fhir" } });
    failNext("PUT /api/projects/:project_id/channels/:id", {
      status: 422,
      code: "invalid",
      detail: "The request body is not valid.",
      errors: [{ code: "taken", detail: "A channel with this name already exists in this project", pointer: "#/name" }],
    });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create channel" }));
    const error = await within(dialog()).findByText("A channel with this name already exists in this project", {}, wait);
    expect(screen.getByLabelText("Name").getAttribute("aria-describedby")).toContain(error.id);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Lab results" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create channel" }));
    expect(await screen.findByText("Created Lab results.", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(where()).toBe(list);
    expect(rowOf("Lab results").textContent).toContain("https://example.org/fhir");
  });

  it("shows a refused auth method under Client credentials", async () => {
    renderAt(`${list}/${shr!.id}/edit`);
    await screen.findByLabelText("Name", {}, wait);
    failNext("PUT /api/projects/:project_id/channels/:id", {
      status: 422,
      code: "invalid",
      detail: "The request body is not valid.",
      errors: [{ code: "not_found", detail: "is not one of this project's webhook auth methods", pointer: "#/client_auth_method_ids/0" }],
    });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    const error = await within(dialog()).findByText("is not one of this project's webhook auth methods", {}, wait);
    expect(within(dialog()).getByRole("group", { name: "Client credentials" }).getAttribute("aria-describedby")).toContain(error.id);
  });

  it("refuses an edit made over someone else's change, in the modal", async () => {
    renderAt(`${list}/${shr!.id}/edit`);
    const name = await screen.findByLabelText("Name", {}, wait);
    await saveElsewhere();
    fireEvent.change(name, { target: { value: "SHR" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    const alert = await within(dialog()).findByRole("alert", {}, wait);
    expect(alert.textContent).toContain("Someone else changed this channel since you loaded it. Load it again and retry.");
    expect(where()).toBe(`${list}/${shr!.id}/edit`);
  });

  it("deletes a channel after asking", async () => {
    renderAt();
    await screen.findByRole("table", {}, wait);
    fireEvent.click(within(rowOf("DHIS2 tracker")).getByRole("button", { name: "Delete DHIS2 tracker" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete channel" }));
    expect(await screen.findByText("Channel deleted.", {}, wait)).toBeTruthy();
    expect(screen.queryByText("DHIS2 tracker")).toBeNull();
  });

  it("shows a viewer the list with no switch, Edit or Delete, and New channel off", async () => {
    await signInAsViewer();
    renderAt();
    await screen.findByRole("table", {}, wait);
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.queryByRole("link", { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete/ })).toBeNull();
    expect(isDisabled(screen.getByRole("button", { name: "New channel" }))).toBe(true);
  });

  it("sends a viewer's /channels/new back to the list", async () => {
    await signInAsViewer();
    renderAt(`${list}/new`);
    await waitFor(() => expect(where()).toBe(list), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("sends an edit of a channel this project doesn't have back to the list, once the list has loaded", async () => {
    const unknown = `${list}/9e8d7c6b-0000-4e3d-8c2b-1a0f9e8d7c6b/edit`;
    renderAt(unknown);
    await screen.findByTestId("where", {}, wait);
    expect(where()).toBe(unknown);
    await screen.findByRole("table", {}, wait);
    await waitFor(() => expect(where()).toBe(list), wait);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

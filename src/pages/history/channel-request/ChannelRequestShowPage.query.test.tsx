import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import ProjectGate from "@/components/shell/ProjectGate.query";
import SessionGate from "@/components/shell/SessionGate.query";
import { projects } from "@/mock-data/projects";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { tooltipOf } from "@/test/tooltip";
import ChannelRequestShowPageQuery from "./ChannelRequestShowPage.query";

const wait = { timeout: 3000 };
const openhie = projects[0]!;
const sandbox = projects.find((p) => p.parentId === openhie.id)!;
const SUCCESS = "4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60";
// Ran on SHR proxy's version 2, named "Patient proxy" then; the channel is at 3 now.
const OLDER_CONFIG = "7b3e0d2a-91c4-4f6e-8a5d-2c1b9e7f4a30";
const WIPED = "e5b1c7d3-0a9f-4b2e-8d6c-3f1a5e7b9c02";
const DELETED_AUTH = "b8d4f0a2-6c1e-4a3b-9f7d-5e2c8a0b4d61";

/** Turns on experimental features for that user, who must be the one signed in, as Profile's switch does. */
async function experimentalOn(userId = "user-amy") {
  await request("PATCH", `/api/users/${userId}`, { experimental_features: true });
}

function renderQuery(requestId: string, projectId = openhie.id) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/history/channels/${requestId}`]}>
        <ReactRouterAdapter>
          <Routes>
            <Route element={<SessionGate />}>
              <Route path="/projects/:projectId" element={<ProjectGate />}>
                <Route path="history" element={<p>Work orders</p>} />
                <Route path="history/channels/:requestId" element={<ChannelRequestShowPageQuery />} />
              </Route>
            </Route>
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

const context = () => document.getElementById("context-section")!;
const openContext = () => fireEvent.click(screen.getByRole("button", { name: "Context" }));

describe("ChannelRequestShowPageQuery", () => {
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

  it("loads the request with the channel name it ran on and the id clients see, and its config unchanged", async () => {
    await experimentalOn();
    renderQuery(SUCCESS);
    expect(await screen.findByRole("heading", { level: 1, name: "Channel request c81d3e5a" }, wait)).toBeTruthy();
    expect(screen.getByRole("link", { name: "SHR proxy" }).getAttribute("href")).toBe(`/projects/${openhie.id}/channels/5c3e9a1d-7b2f-4e8a-9c6d-1f0e2d3c4b5a/edit`);
    expect(screen.getByText("Partner API key (API key)")).toBeTruthy();
    expect(screen.getByText("OpenHIE HAPI FHIR")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Channels" }).getAttribute("href")).toBe(`/projects/${openhie.id}/history/channels`);
    openContext();
    expect(within(context()).getByText("Config version")).toBeTruthy();
    expect(within(context()).queryByText("Config changed")).toBeNull();
  });

  it("names the channel as the request ran on it, and says the config changed when the channel's version is newer", async () => {
    await experimentalOn();
    renderQuery(OLDER_CONFIG);
    await screen.findByRole("heading", { level: 1, name: "Channel request e2a94f17" }, wait);
    expect(screen.getByRole("link", { name: "Patient proxy" })).toBeTruthy();
    expect(screen.queryByText("SHR proxy")).toBeNull();
    openContext();
    expect(within(context()).getByText("Config changed")).toBeTruthy();
  });

  it("says Not Found for a request from another project the person can open", async () => {
    await experimentalOn();
    renderQuery(SUCCESS, sandbox.id);
    expect(await screen.findByRole("heading", { name: "Not Found" }, wait)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Channel request" })).toBeTruthy();
    expect(screen.queryByText("SHR proxy")).toBeNull();
  });

  it("says No Access for a request the server doesn't hold", async () => {
    await experimentalOn();
    renderQuery("00000000-0000-4000-8000-000000000000");
    expect(await screen.findByRole("heading", { name: "No Access" }, wait)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Channel request" })).toBeTruthy();
  });

  it("shows the server's message when the request can't be loaded", async () => {
    await experimentalOn();
    failNext("GET /api/channel_requests/:id", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderQuery(SUCCESS);
    expect((await screen.findByRole("alert", {}, wait)).textContent).toBe("Something went wrong in Lightning.");
  });

  it("sends someone without experimental features to the project's History", async () => {
    renderQuery(SUCCESS);
    expect(await screen.findByText("Work orders", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Channel request/ })).toBeNull();
  });

  it("points an admin at the retention policy when the request was wiped", async () => {
    await experimentalOn();
    renderQuery(WIPED);
    expect(await screen.findByRole("heading", { name: "No Request/Response Data here!" }, wait)).toBeTruthy();
    expect(screen.getByRole("link", { name: "this policy" }).getAttribute("href")).toBe(`/projects/${openhie.id}/settings#data-storage`);
    expect(document.getElementById("request-section")).toBeNull();
  });

  it("names the project's owner and admins to an editor when the request was wiped", async () => {
    await request("POST", "/api/session", { email: "editor@openfn.org", password: FAKE_PASSWORD });
    await experimentalOn("user-esther");
    renderQuery(WIPED);
    expect(await screen.findByText(/Contact one of your/, {}, wait)).toBeTruthy();
    expect(screen.queryByRole("link", { name: "this policy" })).toBeNull();
    expect(await tooltipOf(screen.getByText("project admins"))).toBe("demo@openfn.org");
  });

  it("says (deleted) for an auth method and credential deleted since", async () => {
    await experimentalOn();
    renderQuery(DELETED_AUTH);
    expect(await screen.findByText("(deleted) (API key)", {}, wait)).toBeTruthy();
    expect(screen.getByText("(deleted)")).toBeTruthy();
  });
});

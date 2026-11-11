import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { failNext, resetFakeApi, sentRequests } from "@/api/testing";
import { WORK_ORDER_REFRESH_MS } from "@/api/work-orders";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import ProjectGate from "@/components/shell/ProjectGate.query";
import HistoryWorkOrdersPageQuery from "./HistoryWorkOrdersPage.query";

const wait = { timeout: 3000 };
const OPENHIE = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";

function renderQuery(search: string) {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <MemoryRouter initialEntries={[`/projects/${OPENHIE}/history?${search}`]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/projects/:projectId" element={<ProjectGate />}>
                <Route path="history" element={<HistoryWorkOrdersPageQuery />} />
              </Route>
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ApiProvider>
    </SessionProvider>
  );
}

const listRequests = () => sentRequests().filter((r) => r.startsWith(`GET /api/projects/${OPENHIE}/work_orders?`));

describe("HistoryWorkOrdersPageQuery", () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer; the fake clock moves on with real time.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  it("sends a status filter in the URL to the server as state", async () => {
    renderQuery("filters[failed]=true");
    await waitFor(() => expect(listRequests()[0]).toContain("state=failed"), wait);
  });

  it("asks for page 2", async () => {
    renderQuery("filters[failed]=true&page=2");
    await waitFor(() => expect(listRequests()[0]).toContain("page=2"), wait);
  });

  it("asks once with no filters in the URL, though the default is a moving 'past 30 days'", async () => {
    renderQuery("");
    await waitFor(() => expect(listRequests()).toHaveLength(1), wait);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(listRequests()).toHaveLength(1);
  });

  it("shows a failed load", async () => {
    failNext("GET /api/projects/:project_id/work_orders", { status: 500, code: "internal", detail: "Boom" });
    renderQuery("filters[failed]=true");
    await screen.findByText("There was an error loading the work orders", {}, wait);
  });

  it("asks again while a row on screen is running", async () => {
    renderQuery("filters[running]=true");
    await screen.findByText("Running", { selector: "td *" }, wait);
    const before = listRequests().length;
    await act(() => vi.advanceTimersByTimeAsync(WORK_ORDER_REFRESH_MS + 500));
    expect(listRequests().length).toBeGreaterThan(before);
  });

  it("doesn't ask again once every row on screen has finished", async () => {
    renderQuery("filters[success]=true");
    await waitFor(() => expect(listRequests()).toHaveLength(1), wait);
    await act(() => vi.advanceTimersByTimeAsync(WORK_ORDER_REFRESH_MS * 2));
    expect(listRequests()).toHaveLength(1);
  });
});

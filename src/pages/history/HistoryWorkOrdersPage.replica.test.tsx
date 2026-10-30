import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/primitives/Toast";
import { session } from "../../mock-data/users";
import { RouterProvider, type Router } from "../../routing/router";
import SessionProvider from "../../session/SessionProvider";
import HistoryWorkOrdersPageReplica from "./HistoryWorkOrdersPage.replica";

const PROJECT = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";

function renderReplica() {
  const router: Router = {
    navigate: vi.fn(),
    useHref: (to) => to,
    useLocation: () => ({ pathname: "/", search: "", hash: "" }),
  };
  render(
    <SessionProvider session={session}>
      <RouterProvider value={router}>
        <ToastProvider>
          {/* No date filter, so the fixtures show whatever today is. */}
          <MemoryRouter
            initialEntries={[`/projects/${PROJECT}/history?filters[log]=true`]}
          >
            <Routes>
              <Route
                path="/projects/:projectId/history"
                element={<HistoryWorkOrdersPageReplica />}
              />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </RouterProvider>
    </SessionProvider>,
  );
}

describe("HistoryWorkOrdersPageReplica", () => {
  it("retries the ticked work orders and says so as Lightning does", async () => {
    renderReplica();
    await userEvent.click(document.getElementById("select_wo-g1")!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Rerun 1 selected work order from start",
      }),
    );
    expect(
      await screen.findByText(
        "New run enqueued for 1 workorder",
        {},
        { timeout: 2000 },
      ),
    ).toBeTruthy();
  });

  it("has a second page of OpenHIE work orders, so ticking page 1 offers all matching", async () => {
    renderReplica();
    await userEvent.click(document.getElementById("select_all")!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByRole("button", {
        name: /^Rerun all \d+ matching work orders from start$/,
      }),
    ).toBeTruthy();
  });

  it("adds an enqueued run to the work order when a step is rerun, without a flash", async () => {
    renderReplica();
    const row = document.getElementById("toggle_details_for_wo-g1")!;
    await userEvent.click(row);
    await userEvent.click(screen.getByRole("button", { name: "Run this step with the latest version of this workflow" }));
    expect(await screen.findByText(/enqueued/, {}, { timeout: 2000 })).toBeTruthy();
    expect(row.textContent).toContain("Enqueued");
    expect(screen.queryByText(/New run/)).toBeNull();
  });
});

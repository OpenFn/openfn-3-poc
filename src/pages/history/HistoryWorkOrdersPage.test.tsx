import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/Toast";
import { RouterProvider, type Router } from "../../routing/router";
import type { RunRow, StepRow, WorkOrderRow } from "../../types/history";
import { RequestError } from "../../utils/errors";
import HistoryWorkOrdersPage, { type HistoryWorkOrdersPageProps, type WorkOrderFilters } from "./HistoryWorkOrdersPage";

const step = (id: string, jobId: string, over: Partial<StepRow> = {}): StepRow => ({
  id,
  jobId,
  jobName: `Job ${jobId}`,
  exitReason: "success",
  errorType: null,
  startedAt: "2026-10-14T09:30:00Z",
  finishedAt: "2026-10-14T09:30:02Z",
  cloned: false,
  inputWiped: false,
  jobDeleted: false,
  href: `/projects/p1/runs/r-${id}?step=${id}`,
  inspectHref: `/projects/p1/w/w1?run=r-${id}&panel=editor&job=${jobId}#log`,
  ...over,
});

const run = (id: string, steps: StepRow[], over: Partial<RunRow> = {}): RunRow => ({
  id,
  state: "success",
  insertedAt: "2026-10-14T09:30:00Z",
  claimedAt: "2026-10-14T09:30:00Z",
  startedAt: "2026-10-14T09:30:00Z",
  finishedAt: "2026-10-14T09:30:05Z",
  updatedAt: "2026-10-14T09:30:05Z",
  href: `/projects/p1/runs/${id}`,
  steps,
  ...over,
});

const row = (id: string, over: Partial<WorkOrderRow> = {}): WorkOrderRow => ({
  id,
  workflowId: "w1",
  workflowName: "Referrals",
  state: "success",
  dataclipId: `dc-${id}`,
  dataclipWiped: false,
  insertedAt: "2026-10-14T09:29:00Z",
  lastActivity: "2026-10-14T09:30:05Z",
  runs: [run(`run-${id}`, [step(`s-${id}`, "j1")])],
  href: `/projects/p1/history?filters[workorder_id]=${id}`,
  workflowHref: `/projects/p1/w/w1?run=run-${id}`,
  dataclipHref: `/projects/p1/dataclips/dc-${id}/show`,
  ...over,
});

const filters: WorkOrderFilters = {
  workflowId: null,
  statuses: [],
  receivedAfter: null,
  receivedBefore: null,
  activityAfter: "2026-09-14T09:00:00.000Z",
  activityBefore: null,
  runStatuses: [],
  runCreatedAfter: null,
  runCreatedBefore: null,
  workorderId: null,
  errorSignature: null,
  searchTerm: "",
  searchFields: ["log"],
};

const rows = [row("a1b2c3d4-0000-0000-0000-000000000001"), row("b1b2c3d4-0000-0000-0000-000000000002")];

function renderPage(props: Partial<HistoryWorkOrdersPageProps> = {}, search = "") {
  const router: Router = { navigate: vi.fn(), useHref: (to) => to, useLocation: () => ({ pathname: "/projects/p1/history", search, hash: "" }) };
  const handlers = {
    onCancelWorkOrder: vi.fn().mockResolvedValue(undefined),
    onRetryWorkOrder: vi.fn().mockResolvedValue(undefined),
    onCancelRun: vi.fn().mockResolvedValue(undefined),
    onRetryStep: vi.fn().mockResolvedValue(undefined),
    onBulkCancel: vi.fn().mockResolvedValue(undefined),
    onBulkRetry: vi.fn().mockResolvedValue(undefined),
    onExport: vi.fn().mockResolvedValue(undefined),
    onCheckRunLimit: vi.fn().mockResolvedValue(undefined),
  };
  const page = (props: Partial<HistoryWorkOrdersPageProps>) => (
    <RouterProvider value={router}>
      <ToastProvider>
        <HistoryWorkOrdersPage
          project={{ id: "p1", parentId: null, color: null }}
          projectLabel="Malawi HIV"
          channelsEnabled={false}
          workOrdersHref="/host/work-orders"
          channelLogsHref="/host/channel-logs"
          workflows={[
            { id: "w1", name: "Referrals", jobs: [{ id: "j1", name: "Job j1" }, { id: "j2", name: "Job j2" }] },
            { id: "w2", name: "Stock", jobs: [] },
          ]}
          filters={filters}
          rows={rows}
          state="ready"
          page={{ number: 1, size: 10, totalEntries: 2 }}
          sort={{ key: "last_activity", direction: "desc" }}
          searchLimit={50}
          canRunWorkflow
          dataStorageHref="/projects/p1/settings#data-storage"
          {...handlers}
          {...props}
        />
      </ToastProvider>
    </RouterProvider>
  );
  const { rerender } = render(page(props));
  return { router, ...handlers, rerender: (next: Partial<HistoryWorkOrdersPageProps>) => rerender(page(next)) };
}

/** The query of the URL the page last navigated to. */
const lastQuery = (router: Router) => new URL(vi.mocked(router.navigate).mock.lastCall![0], "http://x").searchParams;
const rowOf = (id: string) => document.getElementById(`toggle_details_for_${id}`)!;
const chip = (id: string) => document.getElementById(id)!;

describe("HistoryWorkOrdersPage", () => {
  it("lists the work orders with the host's links", () => {
    renderPage();
    const first = rowOf(rows[0]!.id);
    expect(within(first).getByRole("link", { name: "a1b2c3d4" }).getAttribute("href")).toBe(rows[0]!.href);
    expect(within(first).getByRole("link", { name: "Referrals" }).getAttribute("href")).toBe(rows[0]!.workflowHref);
    expect(within(first).getByRole("link", { name: /^dc-a1b2/ }).getAttribute("href")).toBe(rows[0]!.dataclipHref);
    expect(screen.getByText(/Showing/).textContent).toContain("1 to 2 of 2");
  });

  it("opens a row to its runs and steps, and reruns a step", async () => {
    const { onRetryStep } = renderPage();
    await userEvent.click(rowOf(rows[0]!.id));
    const runCard = document.getElementById(`run_run-${rows[0]!.id}`)!;
    expect(within(runCard).getByRole("link", { name: "Job j1" }).getAttribute("href")).toBe(rows[0]!.runs[0]!.steps[0]!.href);
    expect(within(runCard).getByRole("link", { name: "Inspect this step" }).getAttribute("href")).toContain("#log");
    await userEvent.click(within(runCard).getByRole("button", { name: "Run this step with the latest version of this workflow" }));
    expect(onRetryStep).toHaveBeenCalledWith(`run-${rows[0]!.id}`, `s-${rows[0]!.id}`);
  });

  it("opens the work order the URL filters to, with every run", () => {
    const wo = row("c1", { runs: [run("new", [step("s2", "j1")]), run("old", [step("s1", "j1")])] });
    renderPage({ rows: [wo], filters: { ...filters, workorderId: "c1" } });
    expect(document.getElementById("run_new")).toBeTruthy();
    expect(document.getElementById("run_old")).toBeTruthy();
    expect(chip("workorder-id-filter-chip").textContent).toContain("Work order: c1");
  });

  it("writes every filter to the URL on a change, so the rest are kept, and starts at page 1", async () => {
    const { router } = renderPage({}, "?page=3");
    await userEvent.click(within(chip("workflow-filter-chip")).getByRole("button", { name: /Workflow is any/ }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Stock" }));
    const q = lastQuery(router);
    expect(q.get("filters[workflow_id]")).toBe("w2");
    expect(q.get("filters[date_after]")).toBe(filters.activityAfter);
    expect(q.get("filters[log]")).toBe("true");
    expect(q.get("filters[sort_by]")).toBe("last_activity");
    expect(q.get("page")).toBeNull();
  });

  it("names the date, run and error signature filters, and clears the run status ones", async () => {
    const { router } = renderPage(
      {
        filters: {
          ...filters,
          activityAfter: "2026-10-01T00:00:00Z",
          runStatuses: ["failed", "crashed"],
          runCreatedAfter: "2026-10-14T09:00:00Z",
          runCreatedBefore: "2026-10-14T10:00:00Z",
          errorSignature: { exitReason: "kill", errorType: "TimeoutError", jobId: "j9", jobName: "Load" },
        },
      },
      "?filters[run_status][]=failed&filters[run_status][]=crashed"
    );
    expect(chip("activity-filter-chip").textContent).toContain("Last activity after 1-Oct");
    expect(chip("run-status-filter-chip").textContent).toContain("Run status: Failed, Crashed");
    expect(chip("run-dates-filter-chip").textContent).toContain("Run created 14-Oct 09:00 – 14-Oct 10:00 UTC");
    expect(chip("error-signature-filter-chip").textContent).toContain("kill:TimeoutError @ Load");

    await userEvent.click(within(chip("run-status-filter-chip")).getByRole("button", { name: /clear/i }));
    expect(lastQuery(router).getAll("filters[run_status][]")).toEqual([]);
  });

  it("links the sortable columns to the URL that re-sorts them", () => {
    renderPage();
    const sortLink = (name: string) => new URL(screen.getByRole("link", { name }).getAttribute("href")!, "http://x").searchParams;
    expect(sortLink("Created").get("filters[sort_by]")).toBe("inserted_at");
    expect(sortLink("Created").get("filters[sort_direction]")).toBe("desc");
    expect(sortLink("Last Activity").get("filters[sort_direction]")).toBe("asc");
    expect(sortLink("Created").get("filters[date_after]")).toBe(filters.activityAfter);
  });

  it("counts a search, with + at the limit", () => {
    renderPage({ filters: { ...filters, searchTerm: "boom" }, page: { number: 1, size: 10, totalEntries: 50 } });
    expect(screen.getByText(/work orders with runs matching/).textContent).toContain('50+ work orders with runs matching "boom" (try more specific filters)');
  });

  it("shows the loading and failed searches in the table", () => {
    const { rerender } = renderPage({ state: "loading" });
    expect(screen.getByText("Loading work orders ...")).toBeTruthy();
    expect(rowOf(rows[0]!.id)).toBeNull();
    rerender({ state: "error" });
    expect(screen.getByText("There was an error loading the work orders")).toBeTruthy();
    expect(rowOf(rows[0]!.id)).toBeNull();
  });

  it("retries the ticked work orders", async () => {
    const { onBulkRetry } = renderPage();
    await userEvent.click(document.getElementById(`select_${rows[0]!.id}`)!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await userEvent.click(screen.getByRole("button", { name: "Rerun 1 selected work order from start" }));
    expect(onBulkRetry).toHaveBeenCalledWith([rows[0]!.id], null);
  });

  it("offers every matching work order when the whole page of many is ticked", async () => {
    const { onBulkCancel } = renderPage({
      rows: rows.map((r) => ({ ...r, state: "pending" as const })),
      page: { number: 1, size: 2, totalEntries: 7 },
    });
    await userEvent.click(document.getElementById("select_all")!);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel up to 7 matching" }));
    expect(onBulkCancel).toHaveBeenCalledWith("all");
  });

  it("retries every matching work order from the OR layout when the whole page of many is ticked", async () => {
    const { onBulkRetry, onCheckRunLimit } = renderPage({ page: { number: 1, size: 2, totalEntries: 7 } });
    await userEvent.click(document.getElementById("select_all")!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onCheckRunLimit).toHaveBeenCalledWith(2);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("OR")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Rerun 2 selected work orders from start" })).toBeTruthy();
    await userEvent.click(within(dialog).getByRole("button", { name: "Rerun all 7 matching work orders from start" }));
    expect(onBulkRetry).toHaveBeenCalledWith("all", null);
  });

  it("says the search in words when the whole page is ticked", async () => {
    renderPage({ filters: { ...filters, workflowId: "w1", statuses: ["failed"] }, page: { number: 1, size: 2, totalEntries: 7 } });
    await userEvent.click(document.getElementById("select_all")!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(screen.getByText(/You've selected all 2 work orders from page 1 of 4/).textContent).toContain(
      "for Referrals workflow, which was last run after 14/9/26 at 9:00am, having a status of 'Failed'"
    );
  });

  it("retries from a job the selected last runs reached, and disables the others", async () => {
    const { onBulkRetry } = renderPage();
    await userEvent.click(document.getElementById(`select_${rows[0]!.id}`)!);
    await userEvent.click(document.getElementById(`select_${rows[1]!.id}`)!);
    await userEvent.click(screen.getByRole("button", { name: "Retry from" }));
    expect((screen.getByLabelText("Job j2") as HTMLInputElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Rerun 2 selected work orders from selected job" }));
    expect(onBulkRetry).toHaveBeenCalledWith([rows[0]!.id, rows[1]!.id], "j1");
  });

  it("toasts a refused row action", async () => {
    const { onRetryWorkOrder } = renderPage();
    onRetryWorkOrder.mockRejectedValueOnce(new RequestError("Runs for deleted workflows cannot be retried"));
    await userEvent.click(within(rowOf(rows[0]!.id)).getByRole("button", { name: "Retry (run from the start)" }));
    expect(onRetryWorkOrder).toHaveBeenCalledWith(rows[0]!.id);
    await waitFor(() => expect(screen.getByText("Runs for deleted workflows cannot be retried")).toBeTruthy());
  });

  it("keeps the bulk modal open with the reason when the host refuses", async () => {
    const { onBulkRetry } = renderPage();
    onBulkRetry.mockRejectedValueOnce(new RequestError("You have reached your run limit"));
    await userEvent.click(document.getElementById(`select_${rows[0]!.id}`)!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await userEvent.click(screen.getByRole("button", { name: "Rerun 1 selected work order from start" }));
    expect(await screen.findByText("You have reached your run limit")).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("doesn't retry a running work order, alone or in a selection", async () => {
    const running = row("r1", { state: "running" });
    renderPage({ rows: [running, rows[0]!] });
    expect(within(rowOf("r1")).queryByRole("button", { name: "Retry (run from the start)" })).toBeNull();
    await userEvent.click(document.getElementById("select_r1")!);
    await userEvent.click(document.getElementById(`select_${rows[0]!.id}`)!);
    expect((screen.getByRole("button", { name: "Retry" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("links the tabs where the host says", () => {
    renderPage({ channelsEnabled: true });
    expect(screen.getByRole("tab", { name: "Work Orders" }).getAttribute("href")).toBe("/host/work-orders");
    expect(screen.getByRole("tab", { name: "Channel Logs" }).getAttribute("href")).toBe("/host/channel-logs");
  });

  it("says why a wiped input can't be rerun, and where to change the policy", async () => {
    const { rerender } = renderPage({ rows: [row("w1", { dataclipWiped: true })] });
    await userEvent.hover(document.getElementById("select_w1")!.parentElement!);
    const link = await screen.findByRole("link", { name: "Go to data storage settings" });
    expect(link.getAttribute("href")).toBe("/projects/p1/settings#data-storage");
    await userEvent.unhover(document.getElementById("select_w1")!.parentElement!);

    rerender({ rows: [row("w1", { dataclipWiped: true })], dataStorageHref: null });
    await userEvent.hover(document.getElementById("select_w1")!.parentElement!);
    expect((await screen.findAllByText(/contact one of your project admins/)).length).toBeGreaterThan(0);
  });

  it("checks the run limit before opening Retry, and says the refusal instead", async () => {
    const { onCheckRunLimit } = renderPage();
    onCheckRunLimit.mockRejectedValueOnce(new RequestError("You have reached your run limit"));
    await userEvent.click(document.getElementById(`select_${rows[0]!.id}`)!);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onCheckRunLimit).toHaveBeenCalledWith(1);
    expect(await screen.findByText("You have reached your run limit")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("follows the URL: the search box and the work order it points at", () => {
    const wo = row("c1", { runs: [run("new", [step("s2", "j1")]), run("old", [step("s1", "j1")])] });
    const { rerender } = renderPage({ rows: [wo], filters: { ...filters, searchTerm: "first" } });
    expect((screen.getByPlaceholderText("Search work orders...") as HTMLInputElement).value).toBe("first");
    expect(document.getElementById("run_new")).toBeNull();

    rerender({ rows: [wo], filters: { ...filters, searchTerm: "second", workorderId: "c1" } });
    expect((screen.getByPlaceholderText("Search work orders...") as HTMLInputElement).value).toBe("second");
    expect(document.getElementById("run_old")).toBeTruthy();
  });

  it("writes a ticked status and a cleared error signature to the URL", async () => {
    const { router } = renderPage({
      filters: { ...filters, errorSignature: { exitReason: "kill", errorType: "TimeoutError", jobId: "j9", jobName: null } },
    });
    await userEvent.click(within(chip("status-filter-chip")).getByRole("button", { name: /Status is any/ }));
    await userEvent.click(screen.getByLabelText("Failed"));
    expect(lastQuery(router).get("filters[failed]")).toBe("true");
    expect(lastQuery(router).get("filters[error_signature_exit_reason]")).toBe("kill");

    await userEvent.click(within(chip("error-signature-filter-chip")).getByRole("button", { name: /clear/i }));
    const q = lastQuery(router);
    expect(["exit_reason", "error_type", "job_id"].map((k) => q.get(`filters[error_signature_${k}]`))).toEqual([null, null, null]);
  });

  it("writes a date range to the URL", async () => {
    const { router } = renderPage();
    await userEvent.click(within(chip("received-filter-chip")).getByRole("button", { name: /Received any time/ }));
    await userEvent.type(screen.getByLabelText("Received After"), "2026-10-01T08:30");
    expect(lastQuery(router).get("filters[wo_date_after]")).toBe("2026-10-01T08:30");
  });

  it("writes the search and the fields it searches to the URL", async () => {
    const { router } = renderPage();
    await userEvent.type(screen.getByPlaceholderText("Search work orders..."), "boom");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(lastQuery(router).get("filters[search_term]")).toBe("boom");

    await userEvent.click(screen.getByRole("button", { name: "Include IDs" }));
    const q = lastQuery(router);
    expect(q.get("filters[id]")).toBe("true");
    expect(q.get("filters[log]")).toBe("true");
  });
});

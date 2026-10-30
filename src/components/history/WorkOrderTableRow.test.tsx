import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "../primitives/Table";
import type { RunRow, WorkOrderRow } from "../../types/history";
import { hover, openTooltips } from "../../test/tooltip";
import { zeroPersistenceMessage } from "./runHelpers";
import WorkOrderTableRow from "./WorkOrderTableRow";

const workOrder: WorkOrderRow = {
  id: "7f6e5d4c-0000-4000-8000-000000000001",
  workflowId: "w1",
  workflowName: "Intake",
  state: "success",
  dataclipId: "7f6e5d4c-0000-4000-8000-000000000002",
  dataclipWiped: true,
  insertedAt: "2026-10-01T10:00:00Z",
  lastActivity: "2026-10-01T10:01:00Z",
  runs: [],
  href: "/projects/p1/history",
  workflowHref: null,
  dataclipHref: "/projects/p1/dataclips/7f6e5d4c-0000-4000-8000-000000000002/show",
};

const run: RunRow = {
  id: "run-1",
  state: "success",
  insertedAt: "2026-10-01T10:00:00Z",
  claimedAt: "2026-10-01T10:00:00Z",
  startedAt: "2026-10-01T10:00:00Z",
  finishedAt: "2026-10-01T10:01:00Z",
  updatedAt: "2026-10-01T10:01:00Z",
  href: "/projects/p1/runs/run-1",
  steps: [],
};

const noop = () => {};
const props = { selected: false, onSelect: noop, canRunWorkflow: true, dataStorageHref: null, onCancel: noop, onRetry: noop, onCancelRun: noop, onRetryStep: noop };

describe("WorkOrderTableRow", () => {
  it("passes a wiped work order's checkbox hover to the wrapper that says why", async () => {
    render(
      <Table header={null}>
        <WorkOrderTableRow {...props} workOrder={workOrder} />
      </Table>
    );
    const wrapper = screen.getByRole("checkbox", { name: "Select work order" }).closest(".cursor-not-allowed")!;
    expect(wrapper.classList).toContain("*:pointer-events-none");
    await hover(wrapper);
    expect(openTooltips()[0]).toContain(zeroPersistenceMessage);
  });

  it("tells a screen reader why a wiped work order's retry is disabled", () => {
    render(
      <Table header={null}>
        <WorkOrderTableRow {...props} workOrder={{ ...workOrder, runs: [run] }} />
      </Table>
    );
    expect(screen.getByRole("button", { name: "Retry (run from the start)" }).getAttribute("aria-description")).toBe(zeroPersistenceMessage);
  });

  it("leaves the row collapsed when the disabled retry's wrapper is clicked", () => {
    render(
      <Table header={null}>
        <WorkOrderTableRow {...props} workOrder={{ ...workOrder, runs: [run] }} />
      </Table>
    );
    const rows = screen.getAllByRole("row").length;
    fireEvent.click(screen.getByRole("button", { name: "Retry (run from the start)" }).parentElement!);
    expect(screen.getAllByRole("row")).toHaveLength(rows);
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Table } from "../Table";
import type { HistoryWorkOrder } from "../../types/history";
import { hover, openTooltips } from "../../test/tooltip";
import { zeroPersistenceMessage } from "./runHelpers";
import WorkOrderRow from "./WorkOrderRow";

const workOrder: HistoryWorkOrder = {
  id: "7f6e5d4c-0000-4000-8000-000000000001",
  projectId: "p1",
  workflowId: "w1",
  workflowName: "Intake",
  state: "success",
  dataclipId: "7f6e5d4c-0000-4000-8000-000000000002",
  insertedAt: "2026-10-01T10:00:00Z",
  lastActivity: "2026-10-01T10:01:00Z",
  runIds: [],
  runs: [],
  dataclipWiped: true,
};

describe("WorkOrderRow", () => {
  it("passes a disabled checkbox's hover to the wrapper that says why", async () => {
    render(
      <Table header={null}>
        <WorkOrderRow workOrder={workOrder} projectId="p1" />
      </Table>
    );
    const checkbox = screen.getByRole("checkbox", { name: "Select work order" });
    const wrapper = checkbox.closest(".cursor-not-allowed")!;
    expect(wrapper.classList).toContain("*:pointer-events-none");
    await hover(wrapper);
    expect(openTooltips()).toEqual([zeroPersistenceMessage]);
  });

  it("leaves the row collapsed when the disabled retry's wrapper is clicked", () => {
    const run = {
      id: "run-1",
      workOrderId: workOrder.id,
      state: "success" as const,
      startingTrigger: null,
      startingJob: null,
      createdBy: null,
      insertedAt: "2026-10-01T10:00:00Z",
      startedAt: "2026-10-01T10:00:00Z",
      finishedAt: "2026-10-01T10:01:00Z",
      stepIds: [],
      steps: [],
    };
    render(
      <Table header={null}>
        <WorkOrderRow workOrder={{ ...workOrder, runIds: [run.id], runs: [run] }} projectId="p1" />
      </Table>
    );
    const rows = screen.getAllByRole("row").length;
    fireEvent.click(screen.getByRole("button", { name: zeroPersistenceMessage }).parentElement!);
    expect(screen.getAllByRole("row")).toHaveLength(rows);
  });
});

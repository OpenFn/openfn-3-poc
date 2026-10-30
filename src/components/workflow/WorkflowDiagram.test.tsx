import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { findWorkflowGraph } from "../../mock-data/workflow";
import WorkflowDiagram from "./WorkflowDiagram";

describe("WorkflowDiagram", () => {
  it("tabs through the canvas as it reads: each step, then the paths leaving it, left to right", () => {
    render(<WorkflowDiagram graph={findWorkflowGraph("wf-openhie")!} selection={null} onSelect={() => {}} />);
    const order = screen
      .getAllByRole("button")
      .map((b) => b.closest<HTMLElement>("[data-testid]")?.dataset["testid"])
      .filter((id) => id !== "workflow-diagram");
    expect(order.slice(0, 9)).toEqual([
      "trigger-node-trigger-openhie",
      "edge-label-edge-openhie-root",
      "job-node-job-transform",
      "edge-label-edge-openhie-send",
      "job-node-job-send",
      "edge-label-edge-openhie-ok",
      "edge-label-edge-openhie-failed",
      "job-node-job-notify-ok",
      "job-node-job-notify-failed",
    ]);
  });

  it("leaves a selected step's paths grey, as Lightning does", () => {
    render(
      <WorkflowDiagram graph={findWorkflowGraph("wf-openhie")!} selection={{ kind: "job", id: "job-send" }} onSelect={() => {}} />
    );
    const colour = (id: string) => screen.getByTestId(`edge-label-${id}`).style.color;
    // The trigger's path doesn't touch the selected step.
    for (const id of ["edge-openhie-send", "edge-openhie-ok", "edge-openhie-failed"]) {
      expect(colour(id)).toBe(colour("edge-openhie-root"));
    }
  });
});

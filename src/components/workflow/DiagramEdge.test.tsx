import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DiagramEdge from "./DiagramEdge";

describe("DiagramEdge", () => {
  it.each(["Enter", " "])("names its badge by condition and label, and picks the path with %j", (key) => {
    const onClick = vi.fn();
    render(
      <DiagramEdge
        id="e1"
        source={{ x: 0, y: 0 }}
        target={{ x: 0, y: 200 }}
        conditionType="on_job_failure"
        conditionLabel="Retry"
        onClick={onClick}
      />
    );
    const badge = screen.getByRole("button", { name: "On Failure path: Retry" });
    badge.focus();
    expect(document.activeElement).toBe(badge);
    fireEvent.keyDown(badge, { key });
    expect(onClick).toHaveBeenCalledOnce();
  });
});

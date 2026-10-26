import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DiagramNode from "./DiagramNode";

describe("DiagramNode", () => {
  it("names its run badges for screen readers", () => {
    render(<DiagramNode id="j1" shape="rect" label="Fetch" icon={null} runState="running" startedBy="Ada Lovelace" />);
    expect(screen.getByRole("img", { name: "Step is running" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Started by Ada Lovelace" })).toBeTruthy();
  });
});

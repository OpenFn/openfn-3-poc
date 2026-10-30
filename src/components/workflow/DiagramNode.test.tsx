import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DiagramNode from "./DiagramNode";

describe("DiagramNode", () => {
  it("names its run badges for screen readers", () => {
    render(<DiagramNode id="j1" shape="rect" label="Fetch" icon={null} runState="running" startedBy="Ada Lovelace" />);
    expect(screen.getByRole("img", { name: "Step is running" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "Started by Ada Lovelace" })).toBeTruthy();
  });

  it("shows its hidden + while the keyboard is on it, as it does on hover", () => {
    render(<DiagramNode id="j1" shape="rect" label="Fetch" icon={null} onAddPath={() => {}} />);
    const reveal = screen.getByRole("button", { name: "Add a path to a new step" }).closest(".opacity-0")!;
    expect(reveal.classList).toContain("group-hover:opacity-100");
    expect(reveal.classList).toContain("focus-within:opacity-100");
  });

  it.each(["Enter", " "])("takes focus, is named for its step, and is picked with %j, as with a click", (key) => {
    const onClick = vi.fn();
    render(<DiagramNode id="j1" shape="rect" label="Fetch" sublabel="http" icon={null} runState="running" onClick={onClick} />);
    const node = screen.getByRole("button", { name: "Fetch" });
    node.focus();
    expect(document.activeElement).toBe(node);
    fireEvent.keyDown(node, { key });
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("isn't a button when nothing picks it, as in the read-only preview", () => {
    render(<DiagramNode id="j1" shape="rect" label="Fetch" icon={null} />);
    expect(screen.queryByRole("button", { name: "Fetch" })).toBeNull();
  });
});

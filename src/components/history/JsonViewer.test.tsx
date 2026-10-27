import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { editors } from "../../test/monaco";
import JsonViewer from "./JsonViewer";

describe("JsonViewer", () => {
  it("sets the body once, however often its parent re-renders", () => {
    const text = JSON.stringify({ x: 1, y: [true] }, null, 2);
    const { rerender } = render(<JsonViewer body={{ text }} ariaLabel="Input" />);
    rerender(<JsonViewer body={{ text }} ariaLabel="Input" />);
    rerender(<JsonViewer body={{ text }} ariaLabel="Input" />);

    const model = editors.at(-1)!.model;
    expect(model.getValue()).toBe(text);
    expect(model.setValueCalls).toBe(1);
    expect(screen.getByRole("textbox", { name: "Input" })).toBeTruthy();
    expect(editors.at(-1)).toMatchObject({ theme: "default", options: { readOnly: true } });
  });

  it("copies the body", () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<JsonViewer body={{ text: '{\n  "x": 1\n}' }} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    expect(writeText).toHaveBeenCalledWith('{\n  "x": 1\n}');
  });

  it("has nothing to copy while the body is empty", () => {
    render(<JsonViewer body={{ text: "" }} />);
    expect(screen.queryByRole("button", { name: "Copy to clipboard" })).toBeNull();
  });

  it("shows why a body could not be loaded, with nothing to copy or view", () => {
    render(<JsonViewer body={{ error: "Failed to load content" }} />);
    expect(screen.getByText("Failed to load content")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy to clipboard" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Dataclip" })).toBeNull();
  });
});

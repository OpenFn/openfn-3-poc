import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../../test/tooltip";
import NewRunButton from "./NewRunButton";

describe("NewRunButton", () => {
  it("shows the shortcut only while it can run", async () => {
    const { rerender } = render(<NewRunButton onClick={() => {}} />);
    const button = screen.getByRole("button", { name: /Run/ });
    await hover(button);
    expect(openTooltips()).toEqual(["⌘ Enter"]);

    rerender(<NewRunButton onClick={() => {}} disabled />);
    await hover(screen.getByRole("button", { name: /Run/ }));
    expect(openTooltips()).toEqual([]);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import IconButton from "./IconButton";

describe("IconButton", () => {
  it("marks a toggle that's on as pressed", () => {
    render(<IconButton icon="hero-funnel" label="Filter" active />);
    expect(screen.getByRole("button", { name: "Filter", pressed: true })).toBeTruthy();
  });

  it("passes a disabled button's hover to the wrapper that shows its label", async () => {
    render(<IconButton icon="hero-trash" label="Delete" disabled />);
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button.parentElement!.classList).toContain("cursor-not-allowed");
    expect(button.parentElement!.classList).toContain("*:pointer-events-none");
    await hover(button.parentElement!);
    expect(openTooltips()).toEqual(["Delete"]);
  });
});

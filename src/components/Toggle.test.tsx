import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import Toggle from "./Toggle";

describe("Toggle", () => {
  it("passes a disabled switch's hover to the wrapper that shows its reason", async () => {
    render(<Toggle checked disabled tooltip="Only owners can change this" />);
    const toggle = screen.getByRole("switch");
    expect(toggle.parentElement!.classList).toContain("cursor-not-allowed");
    expect(toggle.parentElement!.classList).toContain("*:pointer-events-none");
    await hover(toggle.parentElement!);
    expect(openTooltips()).toEqual(["Only owners can change this"]);
  });

  it("adds no wrapper to a disabled switch with nothing to say", () => {
    render(<Toggle checked disabled />);
    expect(screen.getByRole("switch").parentElement!.tagName).toBe("DIV");
  });

  it("leaves an enabled switch's tooltip to the Tooltip, with no title box on top", () => {
    render(<Toggle checked={false} label="Disable workflow" tooltip="Turns off every trigger." />);
    expect(screen.getByRole("switch", { name: "Disable workflow" }).hasAttribute("title")).toBe(false);
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import Button from "./Button";

describe("Button", () => {
  it("passes a disabled button's hover to the wrapper that shows its reason", async () => {
    render(<Button disabled tooltip="You can't do that">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.parentElement!.classList).toContain("cursor-not-allowed");
    expect(button.parentElement!.classList).toContain("*:pointer-events-none");
    await hover(button.parentElement!);
    expect(openTooltips()).toEqual(["You can't do that"]);
  });
});

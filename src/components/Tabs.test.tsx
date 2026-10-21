import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import Tabs from "./Tabs";

describe("Tabs", () => {
  it("shows a disabled tab's reason in a tooltip on a wrapper that takes the hover", async () => {
    render(<Tabs active="a" tabs={[{ id: "a", label: "Input" }, { id: "b", label: "Output", disabled: true, disabledReason: "No output yet" }]} />);
    const tab = screen.getByRole("tab", { name: "Output" });
    expect(tab.getAttribute("title")).toBeNull();
    expect(tab.getAttribute("aria-description")).toBe("No output yet");
    expect(tab.parentElement!.classList).toContain("cursor-not-allowed");
    expect(tab.parentElement!.classList).toContain("*:pointer-events-none");
    await hover(tab.parentElement!);
    expect(openTooltips()).toEqual(["No output yet"]);
  });
});

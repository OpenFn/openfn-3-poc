import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Heading from "./Heading";

describe("Heading", () => {
  it("carries the data-ui and data-size hooks the themes style", () => {
    render(<Heading size="xs">Channel</Heading>);
    const heading = screen.getByRole("heading", { name: "Channel" });
    expect(heading.getAttribute("data-ui")).toBe("heading");
    expect(heading.getAttribute("data-size")).toBe("xs");
  });

  it("is restyled as the GDS caption at its smallest size", () => {
    // Read from disk: Vitest hands CSS imports, ?raw too, over empty.
    const themeCss = readFileSync("src/theme/theme.css", "utf8");
    expect(themeCss).toContain('[data-ui="heading"][data-size="xs"] {');
  });
});

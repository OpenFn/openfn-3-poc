import { describe, expect, it } from "vitest";
import { prefersDarkText } from "./colour";

describe("prefersDarkText", () => {
  it.each([
    ["#f59e0b", true],
    ["#10b981", true],
    ["#ffffff", true],
    ["#4f46e5", false],
    ["#1e293b", false],
    ["var(--color-primary-600)", false],
  ])("on %s is %s", (background, dark) => {
    expect(prefersDarkText(background)).toBe(dark);
  });
});

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CodeLines from "./CodeLines";

describe("CodeLines", () => {
  it("scrolls its own box to the first highlighted line, not the page", () => {
    const offsetTop = vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return Number(this.dataset["line"] ?? 0) * 20;
    });
    const { container } = render(<CodeLines lines={["a", "b", "c", "d"]} highlighted={new Set([4, 3])} />);
    expect((container.firstChild as HTMLElement).scrollTop).toBe(60);
    offsetTop.mockRestore();
  });

  it("copes with a very large set of highlighted lines", () => {
    const highlighted = new Set(Array.from({ length: 200_000 }, (_, i) => i + 1));
    expect(() => render(<CodeLines lines={["a"]} highlighted={highlighted} />)).not.toThrow();
  });
});

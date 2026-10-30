import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SplitButton from "./SplitButton";

describe("SplitButton", () => {
  it("blocks both halves while the main action runs", () => {
    render(
      <SplitButton onClick={() => {}} menu={null} pending>
        Run
      </SplitButton>
    );
    const main = screen.getByRole<HTMLButtonElement>("button", { name: /Run/ });
    expect(main.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "More options" }).disabled).toBe(true);
  });
});

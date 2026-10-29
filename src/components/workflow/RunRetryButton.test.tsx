import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../../test/tooltip";
import RunRetryButton from "./RunRetryButton";

describe("RunRetryButton", () => {
  it("shows Retry's shortcut only while it can retry", async () => {
    const { rerender } = render(<RunRetryButton isRetryable onRun={() => {}} onRetry={() => {}} />);
    await hover(screen.getByRole("button", { name: /Retry/ }));
    expect(openTooltips()).toEqual(["⌘ Enter"]);

    rerender(<RunRetryButton isRetryable disabled onRun={() => {}} onRetry={() => {}} />);
    await hover(screen.getByRole("button", { name: /Retry/ }));
    expect(openTooltips()).toEqual([]);
  });
});

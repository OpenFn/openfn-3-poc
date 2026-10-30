import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RangePicker from "./RangePicker";
import { tooltipOf } from "../../../test/tooltip";

function renderPicker(retentionDays: number | null) {
  const onChange = vi.fn();
  render(<RangePicker days="7" onChange={onChange} retentionDays={retentionDays} />);
  return { onChange };
}

describe("RangePicker", () => {
  it("is a radio group that disables ranges past the history retention", () => {
    const { onChange } = renderPicker(14);
    expect(screen.queryByRole("tab", { name: "Last 7 days" })).toBeNull();
    // The segmented control, so the themes style it like every other pill switch.
    expect(screen.getByRole("radiogroup", { name: "Time range" }).getAttribute("data-ui")).toBe("segmented-control");
    const month = screen.getByRole("radio", { name: "Last 30 days" });
    expect(month.getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("radio", { name: "Last 7 days" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("radio", { name: "Last 24 hours" }).hasAttribute("aria-disabled")).toBe(false);

    fireEvent.click(month);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "Last 24 hours" }));
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("names the retention when a disabled range is hovered", async () => {
    renderPicker(14);
    // The tooltip hangs off the wrapper, since a disabled radio drops pointer events.
    expect(await tooltipOf(screen.getByRole("radio", { name: "Last 30 days" }).parentElement!)).toBe("Only 14 days of history are kept for this project.");
  });

  it("leaves every range enabled when retention is unlimited or covers them all", () => {
    for (const retentionDays of [null, 30]) {
      renderPicker(retentionDays);
      for (const name of ["Last 24 hours", "Last 7 days", "Last 30 days"]) {
        expect(screen.getByRole("radio", { name }).hasAttribute("aria-disabled")).toBe(false);
      }
      cleanup();
    }
  });
});

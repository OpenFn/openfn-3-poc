import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ListSearch from "./ListSearch";

const box = () => screen.getByRole("textbox", { name: "Filter" }) as HTMLInputElement;

describe("ListSearch", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("asks once, 300 ms after the last key", () => {
    const onSearch = vi.fn();
    render(<ListSearch value="" onSearch={onSearch} placeholder="Filter" />);
    fireEvent.change(box(), { target: { value: "mal" } });
    fireEvent.change(box(), { target: { value: "malawi" } });
    act(() => vi.advanceTimersByTime(299));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onSearch.mock.calls).toEqual([["malawi"]]);
  });

  it("asks with the newest onSearch once typing pauses, so a sort chosen meanwhile isn't lost", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender } = render(<ListSearch value="" onSearch={first} placeholder="Filter" />);
    fireEvent.change(box(), { target: { value: "mal" } });
    rerender(<ListSearch value="" onSearch={latest} placeholder="Filter" />);
    act(() => vi.advanceTimersByTime(300));
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith("mal");
    // The URL hasn't caught up yet: what's typed stays.
    expect(box().value).toBe("mal");
  });

  it("takes a search from outside (Back) in place of what's typed, and drops the pending one", () => {
    const onSearch = vi.fn();
    const { rerender } = render(<ListSearch value="" onSearch={onSearch} placeholder="Filter" />);
    fireEvent.change(box(), { target: { value: "mal" } });
    rerender(<ListSearch value="tb" onSearch={onSearch} placeholder="Filter" />);
    act(() => vi.advanceTimersByTime(300));
    expect(box().value).toBe("tb");
    expect(onSearch).not.toHaveBeenCalled();
  });
});

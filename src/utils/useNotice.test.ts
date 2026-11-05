import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useNotice } from "./useNotice";

describe("useNotice", () => {
  afterEach(() => vi.useRealTimers());

  it("fades a success after five seconds and keeps an error", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotice<"list">());
    act(() => result.current.say("list", "success", "Saved"));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.notice).toBeNull();
    act(() => result.current.say("list", "danger", "Refused"));
    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.notice?.message).toBe("Refused");
  });

  it("gives the same message a new key each time, so it's read out again", () => {
    const { result } = renderHook(() => useNotice<"list">());
    act(() => result.current.say("list", "success", "Saved"));
    const first = result.current.notice?.key;
    act(() => result.current.say("list", "success", "Saved"));
    expect(result.current.notice?.key).not.toBe(first);
  });
});

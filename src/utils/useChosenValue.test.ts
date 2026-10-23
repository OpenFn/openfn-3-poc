import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useChosenValue } from "./useChosenValue";

const setup = (save: (v: boolean) => Promise<void>, onError = vi.fn()) =>
  renderHook(({ saved }) => useChosenValue(saved, save, onError), { initialProps: { saved: false } });

describe("useChosenValue", () => {
  it("shows the choice at once, and puts back the saved value when the save fails", async () => {
    const onError = vi.fn();
    const { result } = setup(() => Promise.reject(new Error("No")), onError);

    act(() => result.current.choose(true));
    expect(result.current.value).toBe(true);
    await waitFor(() => expect(result.current.value).toBe(false));
    expect(onError).toHaveBeenCalled();
  });

  it("follows the host once it sends a new value, even back to the old one", () => {
    const { result, rerender } = setup(() => new Promise(() => {}));

    act(() => result.current.choose(true));
    rerender({ saved: true });
    expect(result.current.value).toBe(true);
    rerender({ saved: false });
    expect(result.current.value).toBe(false);
  });
});

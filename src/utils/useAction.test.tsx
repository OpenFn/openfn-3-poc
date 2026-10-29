import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../components/Toast";
import { useAction, useActions } from "./useAction";

/** A promise the test settles by hand. */
function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

describe("useAction", () => {
  it("ignores a second run while the first is pending", async () => {
    const first = deferred();
    const handler = vi.fn(() => first.promise);
    const { result } = renderHook(() => useAction(handler));

    let second!: Promise<boolean>;
    act(() => {
      void result.current.run();
      second = result.current.run();
    });
    expect(await second).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
    await act(async () => first.resolve());
    expect(result.current.pending).toBe(false);
  });

  it("toasts the error message with onError: \"toast\"", async () => {
    const show = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider show={show}>{children}</ToastProvider>;
    const { result } = renderHook(() => useAction(() => Promise.reject(new Error("The host is down")), { onError: "toast" }), { wrapper });

    await act(() => result.current.run());
    expect(show).toHaveBeenCalledWith("The host is down", "danger");
    expect(result.current.error?.message).toBe("The host is down");
  });

  it("runs again straight after a cancel, and the dropped answer neither lands nor lifts the new run's guard", async () => {
    const dropped = deferred();
    const handler = vi.fn().mockReturnValueOnce(dropped.promise).mockReturnValue(new Promise<void>(() => {}));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAction(handler, { onSuccess }));

    act(() => void result.current.run());
    act(() => result.current.cancel());
    act(() => void result.current.run());
    expect(handler).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBe(true);

    await act(async () => dropped.resolve());
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.pending).toBe(true);
    act(() => void result.current.run());
    expect(handler).toHaveBeenCalledTimes(2);
  });

  describe("latest", () => {
    it("lets a new run supersede the one in flight, and drops the older answer", async () => {
      const answers = [deferred<string>(), deferred<string>()];
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAction((n: number) => answers[n]!.promise, { latest: true, onSuccess }));

      act(() => {
        void result.current.run(0);
        void result.current.run(1);
      });
      await act(async () => answers[1]!.resolve("newer"));
      await act(async () => answers[0]!.resolve("older"));
      expect(onSuccess.mock.calls).toEqual([["newer"]]);
      expect(result.current.pending).toBe(false);
    });

    it("drops a superseded failure, and stays pending for the newer run", async () => {
      const answers = [deferred(), deferred()];
      const onError = vi.fn();
      const { result } = renderHook(() => useAction((n: number) => answers[n]!.promise, { latest: true, onError }));

      act(() => {
        void result.current.run(0);
        void result.current.run(1);
      });
      await act(async () => answers[0]!.reject(new Error("too late")));
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();
      expect(result.current.pending).toBe(true);
    });

    it("drops the answer of a cancelled run", async () => {
      const answer = deferred<string>();
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useAction(() => answer.promise, { latest: true, onSuccess }));

      let run!: Promise<boolean>;
      act(() => {
        run = result.current.run();
      });
      act(() => result.current.cancel());
      expect(result.current.pending).toBe(false);
      await act(async () => answer.resolve("late"));
      expect(await run).toBe(false);
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it("drops the answer of a run whose component unmounted", async () => {
      const answer = deferred();
      const onError = vi.fn();
      const { result, unmount } = renderHook(() => useAction(() => answer.promise, { latest: true, onError }));

      act(() => void result.current.run());
      unmount();
      await act(async () => answer.reject(new Error("gone")));
      expect(onError).not.toHaveBeenCalled();
    });
  });
});

describe("useActions", () => {
  it("runs two ids at once, each with its own pending and error", async () => {
    const answers: Record<string, ReturnType<typeof deferred>> = { a: deferred(), b: deferred() };
    const handler = vi.fn((id: string) => answers[id]!.promise);
    const { result } = renderHook(() => useActions(handler));

    act(() => {
      void result.current.run("a");
      void result.current.run("b");
    });
    expect(handler.mock.calls).toEqual([["a"], ["b"]]);
    expect(result.current.pending("a")).toBe(true);
    expect(result.current.pending("b")).toBe(true);

    await act(async () => answers["a"]!.reject(new Error("No")));
    expect(result.current.error("a")?.message).toBe("No");
    expect(result.current.pending("a")).toBe(false);
    expect(result.current.error("b")).toBeNull();
    expect(result.current.pending()).toBe(true);
  });

  it("ignores a second run on an id that's pending, and only on that id", async () => {
    const handler = vi.fn(() => new Promise<void>(() => {}));
    const { result } = renderHook(() => useActions(handler));

    let again!: Promise<boolean>;
    act(() => {
      void result.current.run("a");
      again = result.current.run("a");
      void result.current.run("b");
    });
    expect(await again).toBe(false);
    expect(handler.mock.calls).toEqual([["a"], ["b"]]);
  });

  it("with latest, lets a run on one id supersede another's, and only the newer one is pending", async () => {
    const answers: Record<string, ReturnType<typeof deferred<string>>> = { a: deferred<string>(), b: deferred<string>() };
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useActions((id: string) => answers[id]!.promise, { latest: true, onSuccess }));

    act(() => {
      void result.current.run("a");
      void result.current.run("b");
    });
    expect(result.current.pending("a")).toBe(false);
    expect(result.current.pending("b")).toBe(true);
    await act(async () => answers["a"]!.resolve("a"));
    await act(async () => answers["b"]!.resolve("b"));
    expect(onSuccess.mock.calls).toEqual([["b"]]);
  });
});

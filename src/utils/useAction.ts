import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { errorMessage, RequestError } from "./errors";

/** The lifecycle of one request: idle, pending, or failed. */
export interface ActionState {
  pending: boolean;
  /** The last failure, cleared on the next run or by `reset`. */
  error: RequestError | Error | null;
}

export interface Action<Args extends unknown[]> extends ActionState {
  /**
   * Runs the handler. Resolves `true` when it succeeded and `false` when it
   * threw or was dropped, so callers can close a modal or navigate only on
   * success. Never rejects; the failure is in `error`.
   */
  run: (...args: Args) => Promise<boolean>;
  reset: () => void;
  /** Drops the run in flight: its answer, success or failure, is ignored. */
  cancel: () => void;
}

/** One action per id (a list's rows): each id has its own pending, error and double-click guard. */
export interface Actions<Args extends unknown[]> {
  run: (id: string, ...args: Args) => Promise<boolean>;
  /** Whether this id's run is pending; with no id, whether any is. */
  pending: (id?: string) => boolean;
  error: (id: string) => RequestError | Error | null;
  reset: (id: string) => void;
  /** Drops every run in flight: their answers, success or failure, are ignored. */
  cancel: () => void;
}

export interface ActionOptions<R = unknown> {
  /** Called when the handler throws. `"toast"` toasts the message. The error is also in `error`. */
  onError?: ((error: Error) => void) | "toast" | undefined;
  /** Called with what the handler returned, when it succeeds; e.g. to show what a load fetched. */
  onSuccess?: ((value: Awaited<R>) => void) | undefined;
  /**
   * Only the newest run counts: a new run supersedes the one in flight
   * instead of being ignored, and unmounting drops it. A dropped run's
   * answer never reaches state, `onSuccess` or `onError`.
   */
  latest?: boolean | undefined;
}

const idle: ActionState = { pending: false, error: null };
const KEY = "action";

/**
 * Wraps a request handler with pending and error state (STANDARDS.md
 * pattern 1). Every button, form and confirm that talks to the server goes
 * through this, or through a primitive that does (`FormModal`,
 * `ConfirmModal`). A sync handler works too; it just never shows pending.
 *
 * Calls while a run is pending are ignored, which is the double-click
 * guard, unless `latest` is set. State updates after unmount are dropped.
 */
export function useAction<Args extends unknown[], R = void>(
  handler: (...args: Args) => R | Promise<R>,
  options: ActionOptions<R> = {}
): Action<Args> {
  const actions = useActions((_id: string, ...args: Args) => handler(...args), options);
  const { run: runId, reset: resetId, cancel } = actions;
  const run = useCallback((...args: Args) => runId(KEY, ...args), [runId]);
  const reset = useCallback(() => resetId(KEY), [resetId]);
  return { pending: actions.pending(KEY), error: actions.error(KEY), run, reset, cancel };
}

/**
 * `useAction` for a list: `run(id, ...args)` calls `handler(id, ...args)`,
 * and each id has its own pending, error and double-click guard, so two rows
 * can run at once. With `latest`, a run on any id supersedes the last.
 */
export function useActions<Args extends unknown[], R = void>(
  handler: (id: string, ...args: Args) => R | Promise<R>,
  options: ActionOptions<R> = {}
): Actions<Args> {
  const [states, setStates] = useState<Record<string, ActionState>>({});
  const toast = useToast();
  const mounted = useRef(true);
  // The run that holds each id's double-click guard, so a dropped run can't free a newer run's.
  const running = useRef(new Map<string, number>());
  // Runs are numbered, so a `latest` run can tell that a newer run started or that cancel dropped it.
  const newest = useRef(0);
  const props = useRef({ handler, options, toast });
  props.current = { handler, options, toast };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (id: string, ...args: Args) => {
    const only = !!props.current.options.latest;
    if (!only && running.current.has(id)) return false;
    const runNumber = ++newest.current;
    if (!only) running.current.set(id, runNumber);
    const lands = () => (only ? runNumber === newest.current && mounted.current : running.current.get(id) === runNumber);
    const settle = (state: ActionState) => {
      if (mounted.current) setStates((s) => (only ? { [id]: state } : { ...s, [id]: state }));
    };
    settle({ pending: true, error: null });
    try {
      const value = await props.current.handler(id, ...args);
      if (!lands()) return false;
      settle(idle);
      props.current.options.onSuccess?.(value);
      return true;
    } catch (e) {
      const error = e instanceof Error ? e : new RequestError(String(e));
      if (!lands()) return false;
      settle({ pending: false, error });
      const { onError } = props.current.options;
      if (onError === "toast") props.current.toast(errorMessage(error), "error");
      else onError?.(error);
      return false;
    } finally {
      if (running.current.get(id) === runNumber) running.current.delete(id);
    }
  }, []);

  const reset = useCallback((id: string) => setStates((s) => ({ ...s, [id]: idle })), []);
  const cancel = useCallback(() => {
    newest.current++;
    running.current.clear();
    setStates({});
  }, []);

  return {
    run,
    pending: (id) => (id === undefined ? Object.values(states).some((s) => s.pending) : (states[id]?.pending ?? false)),
    error: (id) => states[id]?.error ?? null,
    reset,
    cancel,
  };
}

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StepExitReason } from "../../types/history";
import StepIcon from "./StepIcon";

const icon = (reason: StepExitReason | null, errorType: string | null = null) =>
  render(<StepIcon reason={reason} errorType={errorType} />).container.innerHTML;

describe("StepIcon", () => {
  it("tells a pending, a successful and a failed step apart", () => {
    expect(new Set([icon(null), icon("success"), icon("fail")]).size).toBe(3);
  });

  it("draws a kill it doesn't know as it draws an out-of-memory kill, and a timeout differently", () => {
    const oom = icon("kill", "OOMError");
    expect(icon("kill", "StateTooLargeError")).toBe(oom);
    expect(icon("kill", "SomeFutureWorkerError")).toBe(oom);
    expect(icon("kill", "TimeoutError")).not.toBe(oom);
  });
});

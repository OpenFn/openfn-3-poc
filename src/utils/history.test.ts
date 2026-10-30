import { describe, expect, it } from "vitest";
import { stateLabel } from "./history";

describe("stateLabel", () => {
  it("uses Lightning's words for queued, starting and running, and capitalises the rest", () => {
    expect(stateLabel("pending")).toBe("Enqueued");
    expect(stateLabel("available")).toBe("Enqueued");
    expect(stateLabel("claimed")).toBe("Starting");
    expect(stateLabel("started")).toBe("Running");
    expect(stateLabel("running")).toBe("Running");
    expect(stateLabel("rejected")).toBe("Rejected");
    expect(stateLabel("crashed")).toBe("Crashed");
  });
});

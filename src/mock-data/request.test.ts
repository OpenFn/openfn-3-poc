import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { failNextRequest, simulateRequest } from "./request";

describe("failNextRequest", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("rejects the next request with the field errors it was given, then lets the one after through", async () => {
    failNextRequest("Please fix the errors below.", { name: ["has already been taken"] });

    const failed = simulateRequest("saved");
    const next = simulateRequest("saved");
    const caught = failed.catch((e: unknown) => e);
    await vi.runAllTimersAsync();

    expect(await caught).toMatchObject({ message: "Please fix the errors below.", fieldErrors: { name: ["has already been taken"] } });
    expect(await next).toBe("saved");
  });
});

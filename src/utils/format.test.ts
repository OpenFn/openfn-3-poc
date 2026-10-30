import { describe, expect, it } from "vitest";
import { prettyJson } from "./format";

describe("prettyJson", () => {
  it("indents a JSON object or array, and leaves anything else as it was", () => {
    expect(prettyJson('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyJson(" [1,2] ")).toBe("[\n  1,\n  2\n]");
    expect(prettyJson("{not json}")).toBe("{not json}");
    expect(prettyJson("42")).toBe("42");
    expect(prettyJson("Starting step")).toBe("Starting step");
  });
});

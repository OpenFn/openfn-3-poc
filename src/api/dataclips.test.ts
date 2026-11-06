import { describe, expect, it } from "vitest";
import { dataclipOf, type ApiDataclip } from "./dataclips";

const sent = (attributes: Partial<ApiDataclip["attributes"]>): ApiDataclip => ({
  id: "dc-1",
  attributes: { name: null, type: "global", project_id: "p1", wiped_at: null, inserted_at: "2026-10-01T00:00:00Z", updated_at: "2026-10-01T00:00:00Z", body: null, ...attributes },
});

describe("dataclipOf", () => {
  it("shows a body as Lightning stored it: two-space JSON in the server's key order, and null as null; a wiped one has none", () => {
    expect(dataclipOf(sent({ body: { b: 1, a: [2] } })).body).toEqual({ text: '{\n  "b": 1,\n  "a": [\n    2\n  ]\n}' });
    expect(dataclipOf(sent({ body: null })).body).toEqual({ text: "null" });
    expect(dataclipOf(sent({ wiped_at: "2026-10-20T00:00:00Z" })).body).toBeUndefined();
  });
});

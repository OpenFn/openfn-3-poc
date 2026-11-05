import { describe, expect, it } from "vitest";
import { projectNameErrors } from "@/utils/validate";

describe("projectNameErrors", () => {
  it("is blank when empty", () => {
    expect(projectNameErrors("")).toEqual(["can't be blank"]);
  });

  it("accepts lowercase letters, digits and hyphens", () => {
    expect(projectNameErrors("malaria-programme-2")).toEqual([]);
  });

  it.each(["my_project", "my.project", "café"])("rejects %s, which urlSafeName keeps", (name) => {
    expect(projectNameErrors(name)).toEqual(["has invalid format"]);
  });
});

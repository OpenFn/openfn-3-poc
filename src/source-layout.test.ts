// @vitest-environment node
import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>("./**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

describe("source file layout", () => {
  it("no file starts with a blank line", () => {
    const blank = Object.keys(sources).filter((path) => /^\s*\n/.test(sources[path]!));
    expect(blank).toEqual([]);
  });

  it("imports come before any top-level declaration", () => {
    const late = Object.entries(sources).filter(([, text]) => {
      const lines = text.split("\n");
      const firstDeclaration = lines.findIndex((l) => /^(export |interface |type |const |let |function |class |enum )/.test(l));
      return firstDeclaration >= 0 && lines.slice(firstDeclaration).some((l) => /^import /.test(l));
    });
    expect(late.map(([path]) => path)).toEqual([]);
  });
});

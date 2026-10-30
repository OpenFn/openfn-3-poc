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

  it("a story's group in Storybook is its folder", () => {
    // primitives/ is "Primitives", project-settings/ is "Project settings", any page is "Pages".
    const label = (folder: string) => folder[0]!.toUpperCase() + folder.slice(1).replace(/-/g, " ");
    const wrong = Object.entries(sources)
      .filter(([path]) => /^\.\/(components|pages)\/.*\.stories\.tsx$/.test(path))
      .flatMap(([path, text]) => {
        const [, top, folder] = path.split("/");
        const group = /title: "([^"/]+)\//.exec(text)?.[1];
        const expected = top === "pages" ? "Pages" : label(folder!);
        return group === expected ? [] : [`${path}: "${group}", not "${expected}"`];
      });
    expect(wrong).toEqual([]);
  });
});

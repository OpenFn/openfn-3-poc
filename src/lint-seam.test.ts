// @vitest-environment node
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>("./**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const eslint = new ESLint();

async function seamMessages(filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .filter((m) => m.ruleId === "no-restricted-imports")
    .map((m) => m.message);
}

describe("the data seam lint rule", () => {
  it("every import that crosses the seam is tagged wiring: or debt:", () => {
    const untagged = Object.entries(sources).flatMap(([path, text]) =>
      [...text.matchAll(/(?:\/\/|\/\*)\s*eslint-disable[^\n]*no-restricted-imports[^\n]*/g)]
        .filter((m) => !/ -- (wiring|debt):/.test(m[0]))
        .map((m) => `${path}: ${m[0].trim()}`),
    );
    expect(untagged).toEqual([]);
  });

  it("covers utils and pages, and the router message fits both", async () => {
    const code = 'import { useNavigate } from "react-router-dom";\nexport const x = useNavigate;\n';
    const message =
      "'react-router-dom' import is restricted from being used. Navigate through useRouter() and Link from src/routing/router.";
    expect(await seamMessages("src/utils/seamProbe.ts", code)).toEqual([message]);
    expect(await seamMessages("src/pages/SeamProbePage.tsx", code)).toEqual([message]);
  });

  it("utils may not import mock-data or the session", async () => {
    const code =
      'import { projects } from "../mock-data/projects";\nimport { useCurrentUser } from "../session/session";\nexport const x = [projects, useCurrentUser];\n';
    expect(await seamMessages("src/utils/seamProbe.ts", code)).toHaveLength(2);
  });

  it("pages, components and contract shapes may not import the replica's models, and say so once", async () => {
    const code = (from: string) => `import type { Project } from "${from}";\nexport type X = Project;\n`;
    const message =
      "'../mock-data/models/projects' import is restricted from being used by a pattern. Models are the replica's records: take a hand-written contract shape from src/types/ (STANDARDS §11).";
    expect(await seamMessages("src/pages/SeamProbePage.tsx", code("../mock-data/models/projects"))).toEqual([message]);
    expect(await seamMessages("src/components/SeamProbe.tsx", code("../mock-data/models/projects"))).toEqual([message]);
    expect(await seamMessages("src/types/seamProbe.ts", code("../mock-data/models/projects"))).toEqual([message]);
    expect(await seamMessages("src/pages/x/SeamProbe.replica.tsx", code("../../mock-data/models/projects"))).toEqual([]);
  });
});

describe("the type size lint rule", () => {
  const typeMessages = async (filePath: string, className: string) => {
    const code = `export const X = () => <span className="${className}" />;\n`;
    const [result] = await eslint.lintText(code, { filePath });
    return (result?.messages ?? []).filter((m) => m.message.startsWith("Type size:"));
  };

  it.each(["text-sm", "leading-5", "tracking-wide"])("bans %s in history and nowhere else", async (className) => {
    expect(await typeMessages("src/components/history/Probe.tsx", className)).toHaveLength(1);
    expect(await typeMessages("src/components/Probe.tsx", className)).toEqual([]);
  });

  // A later block for the same file replaces the history block's list, so check every file.
  it("applies to every history component", async () => {
    const files = Object.keys(sources)
      .filter((path) => /^\.\/components\/history\/[^/]+\.tsx$/.test(path) && !/\.(test|stories)\.tsx$/.test(path))
      .map((path) => `src${path.slice(1)}`);
    expect(files.length).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const file of files) {
      const config = await eslint.calculateConfigForFile(file);
      const options = (config.rules?.["no-restricted-syntax"] ?? []) as Array<{ message?: string }>;
      if (!options.some((o) => o?.message?.startsWith("Type size:"))) missing.push(file);
    }
    expect(missing).toEqual([]);
  });
});

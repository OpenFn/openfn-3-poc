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
});

// @vitest-environment node
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>("./**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

// The probes are made-up files outside the TypeScript project, so the type-aware rule is off for them.
const eslint = new ESLint({
  overrideConfig: {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: false } },
    rules: { "@typescript-eslint/no-deprecated": "off" },
  },
});

async function ruleMessages(ruleId: string, filePath: string, code: string) {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).filter((m) => m.ruleId === ruleId).map((m) => m.message);
}
const seamMessages = (filePath: string, code: string) => ruleMessages("no-restricted-imports", filePath, code);
const apiMessages = (filePath: string, code: string) => ruleMessages("@typescript-eslint/no-restricted-imports", filePath, code);

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
      'import { projects } from "@/mock-data/projects";\nimport { useCurrentUser } from "@/session/session";\nexport const x = [projects, useCurrentUser];\n';
    expect(await seamMessages("src/utils/seamProbe.ts", code)).toHaveLength(2);
  });

  it("pages, components and contract shapes may not import the replica's models, and say so once", async () => {
    const code = (from: string) => `import type { WorkflowSummary } from "${from}";\nexport type X = WorkflowSummary;\n`;
    const message = (from: string) =>
      `'${from}' import is restricted from being used by a pattern. Models are the replica's records: take a hand-written contract shape from src/types/ (STANDARDS §11).`;
    for (const [probe, from] of [
      ["src/pages/SeamProbePage.tsx", "@/mock-data/models/workflows"],
      ["src/components/primitives/SeamProbe.tsx", "@/mock-data/models/workflows"],
      ["src/types/seamProbe.ts", "@/mock-data/models/workflows"],
    ] as const) {
      expect(await seamMessages(probe, code(from))).toEqual([message(from)]);
    }
    expect(await seamMessages("src/pages/x/SeamProbe.replica.tsx", code("@/mock-data/models/workflows"))).toEqual([]);
  });

  it("a hook in src/api/ takes the URL and the user as arguments, never reads them", async () => {
    expect(await seamMessages("src/api/probe.ts", `import { useParams } from "react-router-dom";\nexport const x = useParams;\n`)).toHaveLength(1);
    expect(await seamMessages("src/api/probe.ts", `import { useCurrentUser } from "@/session/session";\nexport const x = useCurrentUser;\n`)).toHaveLength(1);
  });

  it("a .query file feeds a page only in src/pages/ and the shell; anywhere else the seam still applies", async () => {
    const code = (from: string) => `import { apiTokens } from "${from}";\nexport const x = apiTokens;\n`;
    expect(await seamMessages("src/pages/x/probe/SeamProbe.query.tsx", code("@/mock-data/tokens"))).toEqual([]);
    expect(await seamMessages("src/components/shell/SeamProbe.query.tsx", code("@/mock-data/tokens"))).toEqual([]);
    expect(await seamMessages("src/components/profile/SeamProbe.query.tsx", code("@/mock-data/tokens"))).toHaveLength(1);
    expect(await seamMessages("src/utils/seamProbe.query.ts", code("@/mock-data/tokens"))).toHaveLength(1);
  });

  it("pages and contract shapes may take CurrentProject from types/projects, but not the Project and User records", async () => {
    const code = (name: string, from: string) => `import type { ${name} } from "${from}";\nexport type X = ${name};\n`;
    expect(await seamMessages("src/pages/SeamProbePage.tsx", code("Project", "@/types/projects"))).toHaveLength(1);
    expect(await seamMessages("src/types/seamProbe.ts", code("User", "./users"))).toHaveLength(1);
    expect(await seamMessages("src/types/seamProbe.ts", code("User", "@/types/users"))).toHaveLength(1);
    expect(await seamMessages("src/pages/SeamProbePage.tsx", code("CurrentProject", "@/types/projects"))).toEqual([]);
  });
});

describe("the type size lint rule", () => {
  const typeMessages = async (filePath: string, className: string) => {
    const code = `export const X = () => <span className="${className}" />;\n`;
    const [result] = await eslint.lintText(code, { filePath });
    return (result?.messages ?? []).filter((m) => m.message.startsWith("Type size:"));
  };

  it.each(["text-sm", "leading-5", "tracking-wide"])("bans %s outside the primitives", async (className) => {
    expect(await typeMessages("src/components/history/Probe.tsx", className)).toHaveLength(1);
    expect(await typeMessages("src/components/projects/health/Probe.tsx", className)).toHaveLength(1);
    expect(await typeMessages("src/pages/Probe.tsx", className)).toHaveLength(1);
    expect(await typeMessages("src/components/primitives/Probe.tsx", className)).toEqual([]);
  });

  // A later block for the same file replaces the consumer block, so check every file.
  it("applies to every component and page outside the primitives", async () => {
    const files = Object.keys(sources)
      .filter((path) => /^\.\/(components\/(?!primitives\/)[^/]+|pages)\/.+\.tsx$/.test(path) && !/\.(test|stories)\.tsx$/.test(path))
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

describe("the tier lint rule", () => {
  const code = (from: string) => `import X from "${from}";\nexport default X;\n`;
  const tier = /^'.*' import is restricted from being used by a pattern\. (A (primitive|pattern|domain component|feature component|util) |Nothing outside src\/pages\/)/;

  it("a primitive may import primitives and utils, not domain, a feature component, the shell or a page", async () => {
    const probe = "src/components/primitives/TierProbe.tsx";
    expect(await seamMessages(probe, code("./Button"))).toEqual([]);
    expect(await seamMessages(probe, code("@/utils/cn"))).toEqual([]);
    for (const from of ["@/components/domain/StatePill", "@/components/history/RunStepList", "@/components/shell/Sidebar", "@/pages/history/RunShowPage"]) {
      expect(await seamMessages(probe, code(from))).toEqual([expect.stringMatching(tier)]);
    }
  });

  it("a domain component may import primitives, patterns and domain, not an area, the shell or a page", async () => {
    const probe = "src/components/domain/TierProbe.tsx";
    for (const from of ["@/components/primitives/Pill", "@/components/patterns/ListPage", "./StatePill", "@/types/history"]) {
      expect(await seamMessages(probe, code(from))).toEqual([]);
    }
    for (const from of ["@/components/history/RunStepList", "@/components/shell/Sidebar", "@/pages/history/RunShowPage"]) {
      expect(await seamMessages(probe, code(from))).toEqual([expect.stringMatching(tier)]);
    }
  });

  it("a pattern may import primitives and patterns, not domain, an area, the shell or a page", async () => {
    const probe = "src/components/patterns/TierProbe.tsx";
    for (const from of ["@/components/primitives/Header", "./ListPage"]) {
      expect(await seamMessages(probe, code(from))).toEqual([]);
    }
    for (const from of ["@/components/domain/StatePill", "@/components/profile/TokensTable", "@/components/shell/Sidebar", "@/pages/history/RunShowPage"]) {
      expect(await seamMessages(probe, code(from))).toEqual([expect.stringMatching(tier)]);
    }
  });

  it("a feature component may import primitives, domain, the shell and its own area, not another area", async () => {
    const probe = "src/components/workflow/TierProbe.tsx";
    for (const from of ["@/components/primitives/Button", "@/components/domain/StatePill", "@/components/shell/ProjectBreadcrumbs", "./EditorHeader", "@/types/history"]) {
      expect(await seamMessages(probe, code(from))).toEqual([]);
    }
    expect(await seamMessages(probe, code("@/components/history/RunStepList"))).toEqual([expect.stringMatching(tier)]);
    expect(await seamMessages("src/components/shell/TierProbe.tsx", code("@/components/history/RunStepList"))).toEqual([
      expect.stringMatching(tier),
    ]);
  });

  it("nothing outside src/pages/ imports a page except App.tsx, src/index.ts and a page's wrapper", async () => {
    for (const probe of [
      "src/components/profile/TierProbe.tsx",
      "src/utils/tierProbe.ts",
      "src/types/tierProbe.ts",
      "src/mock-data/tierProbe.ts",
      "src/session/tierProbe.ts",
    ]) {
      expect(await seamMessages(probe, code("@/pages/profile/profile/ProfilePage"))).toEqual([expect.stringMatching(tier)]);
    }
    expect(await seamMessages("src/App.tsx", code("./pages/profile/profile/ProfilePage"))).toEqual([]);
    expect(await seamMessages("src/index.ts", code("./pages/profile/profile/ProfilePage"))).toEqual([]);
    expect(await seamMessages("src/pages/profile/profile/ProfilePage.query.tsx", code("./ProfilePage"))).toEqual([]);
    expect(await seamMessages("src/pages/admin/TierProbe.tsx", code("@/pages/profile/profile/ProfilePage"))).toEqual([]);
  });

  // A file directly in src/components/ matches no tier's block, so it could import anything.
  it("nothing lives directly in src/components/", () => {
    expect(Object.keys(sources).filter((p) => /^\.\/components\/[^/]+\.tsx?$/.test(p))).toEqual([]);
  });

  it("catches a nested area folder through @/components/", async () => {
    expect(await seamMessages("src/components/projects/health/TierProbe.tsx", code("@/components/history/RunStepList"))).toEqual([
      expect.stringMatching(tier),
    ]);
    expect(await seamMessages("src/components/projects/health/TierProbe.tsx", code("@/components/projects/ProjectsTable"))).toEqual([]);
  });

  it("a util may import primitives and no other components", async () => {
    expect(await seamMessages("src/utils/tierProbe.ts", code("@/components/primitives/Toast"))).toEqual([]);
    for (const from of ["@/components/domain/StatePill", "@/components/history/RunStepList", "@/components/shell/Sidebar"]) {
      expect(await seamMessages("src/utils/tierProbe.ts", code(from))).toEqual([expect.stringMatching(tier)]);
    }
  });

  it("a replica outside src/pages/ doesn't import a page", async () => {
    for (const probe of ["src/utils/probeReplica.ts", "src/components/history/Probe.replica.tsx", "src/mock-data/probeReplica.ts"]) {
      expect(await seamMessages(probe, code("@/pages/admin/users/AdminUsersPage"))).toEqual([
        expect.stringMatching(tier),
      ]);
    }
  });

  it("keeps the seam's patterns in a tier", async () => {
    for (const probe of ["src/components/history/TierProbe.tsx", "src/components/domain/TierProbe.tsx"]) {
      expect(await seamMessages(probe, code("@/session/session"))).toHaveLength(1);
    }
  });
});

describe("the ListPage lint rule", () => {
  const owns = /^ListPage owns the header/;
  const listPageMessages = async (filePath: string, code: string) =>
    (await ruleMessages("no-restricted-syntax", filePath, code)).filter((m) => owns.test(m));
  const page = (from: string) =>
    `import ListPage from "@/components/patterns/ListPage";\nimport X from "${from}";\nexport default [ListPage, X];\n`;

  it.each(["Header", "PageContent", "EmptyState", "AsyncBoundary"])("a page on ListPage may not import %s", async (name) => {
    for (const probe of ["src/pages/x/ProbePage.tsx", "src/components/projects/Probe.tsx"]) {
      expect(await listPageMessages(probe, page(`@/components/primitives/${name}`)), probe).toEqual([expect.stringMatching(owns)]);
    }
  });

  it("lets a page on ListPage import other primitives, and a page without it import these", async () => {
    expect(await listPageMessages("src/pages/x/ProbePage.tsx", page("@/components/primitives/Button"))).toEqual([]);
    const without = 'import EmptyState from "@/components/primitives/EmptyState";\nexport default EmptyState;\n';
    expect(await listPageMessages("src/pages/x/ProbePage.tsx", without)).toEqual([]);
  });
});

describe("the relative import lint rule", () => {
  const code = (from: string) => `import X from "${from}";\nexport default X;\n`;
  // Every block that sets no-restricted-imports replaces the others' options, so each kind of file is probed.
  it.each([
    "src/components/primitives/Probe.tsx",
    "src/components/domain/Probe.tsx",
    "src/components/history/Probe.tsx",
    "src/components/history/Probe.replica.tsx",
    "src/components/history/Probe.stories.tsx",
    "src/pages/history/ProbePage.tsx",
    "src/pages/history/ProbePage.replica.tsx",
    "src/pages/history/ProbePage.test.tsx",
    "src/utils/probe.ts",
    "src/types/probe.ts",
    "src/api/probe.ts",
    "src/annotations/probe.ts",
    "src/mock-data/probe.ts",
    "src/session/probe.ts",
    "src/App.tsx",
    ".storybook/preview.tsx",
  ])("bans ../ in %s, and lets @/ and ./ through", async (probe) => {
    const relative = /^'\.\.\/theme\/themes' import is restricted from being used by a pattern\. Import from @\/… instead of \.\.\//;
    expect(await seamMessages(probe, code("../theme/themes"))).toEqual([expect.stringMatching(relative)]);
    expect(await seamMessages(probe, 'export { x } from "../theme/themes";\n')).toEqual([expect.stringMatching(relative)]);
    expect(await seamMessages(probe, code("@/theme/themes"))).toEqual([]);
    expect(await seamMessages(probe, code("./sibling"))).toEqual([]);
  });
});

describe("the data-flow lint rules (PRINCIPLES.md, How data flows)", () => {
  it("nothing writes a response into the query cache", async () => {
    const code = "declare const client: { setQueryData(k: unknown, v: unknown): void; setQueriesData(k: unknown, v: unknown): void };\nclient.setQueryData([\"credentials\"], []);\nclient.setQueriesData({}, []);\n";
    expect(await ruleMessages("no-restricted-properties", "src/pages/x/SeamProbe.replica.tsx", code)).toHaveLength(2);
    expect(await ruleMessages("no-restricted-properties", "src/api/seamProbe.ts", code)).toHaveLength(2);
  });

  it("src/api/ imports no toasts or components", async () => {
    const code = 'import { useToast } from "@/components/primitives/Toast";\nexport const x = useToast;\n';
    expect(await seamMessages("src/api/seamProbe.ts", code)).toHaveLength(1);
    expect(await seamMessages("src/pages/x/SeamProbe.replica.tsx", 'import { useToast } from "@/components/primitives/Toast";\nexport const x = useToast;\n')).toEqual([]);
  });
});

describe("the API boundary lint rules", () => {
  const code = (from: string) => `import * as x from "${from}";\nexport const y = x;\n`;

  it("only routes, replicas, main.tsx, stories and tests call src/api/", async () => {
    for (const probe of ["src/pages/x/SeamProbePage.tsx", "src/components/primitives/SeamProbe.tsx", "src/session/seamProbe.ts", "src/App.tsx"]) {
      expect(await apiMessages(probe, code("@/api/tokens")), probe).toHaveLength(1);
    }
    for (const probe of ["src/pages/x/SeamProbePage.query.tsx", "src/pages/x/SeamProbe.replica.tsx", "src/main.tsx", "src/pages/x/SeamProbe.stories.tsx", "src/x/seamProbe.test.ts"]) {
      expect(await apiMessages(probe, code("@/api/tokens")), probe).toEqual([]);
    }
  });

  it("only src/api/ uses TanStack Query", async () => {
    expect(await apiMessages("src/pages/x/SeamProbePage.query.tsx", code("@tanstack/react-query"))).toHaveLength(1);
    expect(await apiMessages("src/main.tsx", code("@tanstack/react-query"))).toHaveLength(1);
    expect(await apiMessages("src/api/seamProbe.ts", code("@tanstack/react-query"))).toEqual([]);
  });

  it("only src/api/client.ts reaches the fake server", async () => {
    for (const [probe, from] of [
      ["src/api/tokens.ts", "@/fake-api"],
      ["src/pages/x/SeamProbePage.query.tsx", "@/fake-api"],
      ["src/pages/x/SeamProbe.stories.tsx", "@/fake-api/index"],
      ["src/x/seamProbe.test.ts", "@/fake-api"],
    ] as const) {
      expect(await apiMessages(probe, code(from)), probe).toHaveLength(1);
    }
    expect(await apiMessages("src/api/client.ts", code("@/fake-api"))).toEqual([]);
  });
});

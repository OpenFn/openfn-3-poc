// @vitest-environment node
import { describe, expect, it } from "vitest";
import { viewIdForLocation } from "./annotations/viewIds";

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

// Each list below is what was already missing when the rule started. A file
// leaves its list when it's fixed (the test fails while it stays listed), and
// nothing new joins.
const paths = Object.keys(sources);
const isSource = (path: string) => !/\.(stories|test)\.tsx?$/.test(path);
const pages = paths.filter((path) => /^\.\/pages\/(?:[^/]+\/)+[A-Z]\w*\.tsx$/.test(path));
const components = paths.filter((path) => /^\.\/components\/.+\/[A-Z]\w*\.tsx$/.test(path) && isSource(path));

function expectOnlyKnown(missing: string[], known: string[]) {
  expect({ new: missing.filter((p) => !known.includes(p)), fixed: known.filter((p) => !missing.includes(p)) }).toEqual({ new: [], fixed: [] });
}

describe("every page and component can be seen and checked", () => {
  it("every page has a story", () => {
    const missing = pages.filter((path) => !sources[path.replace(".tsx", ".stories.tsx")]);
    expectOnlyKnown(missing, ["./pages/workflow-editor/WorkflowEditorPage.tsx"]);
  });

  it("every page has a renderPage test", () => {
    const missing = pages.filter((path) => !sources[path.replace(".tsx", ".test.tsx")]);
    expectOnlyKnown(missing, [
      "./pages/admin/AdminLiveDashboardPage.tsx",
      "./pages/auth/AuthConfirmAccountPage.tsx",
      "./pages/auth/AuthResetPasswordPage.tsx",
      "./pages/projects/MfaRequiredPage.tsx",
    ]);
  });

  it("no new page uses a .replica.tsx; new pages are fed by XPage.query.tsx", () => {
    // The .query file feeds, the page draws and behaves (STANDARDS.md pattern 11).
    const replicas = paths.filter((path) => /^\.\/pages\/.+\.replica\.tsx$/.test(path));
    expectOnlyKnown(replicas, [
      "./pages/admin/AdminAuditPage.replica.tsx",
      "./pages/admin/AdminAuthProvidersPage.replica.tsx",
      "./pages/admin/AdminCollectionsPage.replica.tsx",
      "./pages/admin/AdminMaintenancePage.replica.tsx",
      "./pages/admin/AdminProjectsPage.replica.tsx",
      "./pages/admin/AdminUserEditPage.replica.tsx",
      "./pages/admin/AdminUsersPage.replica.tsx",
      "./pages/auth/AuthConfirmationRequiredPage.replica.tsx",
      "./pages/auth/FirstSetupPage.replica.tsx",
      "./pages/history/ChannelRequestShowPage.replica.tsx",
      "./pages/history/DataclipShowPage.replica.tsx",
      "./pages/history/HistoryChannelLogsPage.replica.tsx",
      "./pages/history/HistoryWorkOrdersPage.replica.tsx",
      "./pages/history/RunShowPage.replica.tsx",
      "./pages/profile/BackupCodesPage.replica.tsx",
      "./pages/profile/CredentialsIndexPage.replica.tsx",
      "./pages/profile/ProfilePage.replica.tsx",
      "./pages/project-settings/ProjectSettingsPage.replica.tsx",
      "./pages/projects/ChannelsIndexPage.replica.tsx",
      "./pages/projects/SandboxesIndexPage.replica.tsx",
      "./pages/projects/WorkflowHealthPage.replica.tsx",
    ]);
  });

  // Either quote style: nothing here enforces one.
  const imports = (path: string, from: string) => new RegExp(`from ["']@/${from}["']`).test(sources[path]!);
  const drawsEmptyState = (path: string) => imports(path, "components/primitives/EmptyState");

  it("a table leaves the empty state to ListPage", () => {
    // A page on ListPage passes its table as `list`, and ListPage draws the empty state.
    // A table is any component on the Table primitive, whatever its file is called.
    const drawers = components.filter((path) => imports(path, "components/primitives/Table") && drawsEmptyState(path));
    expectOnlyKnown(drawers, [
      "./components/admin/AdminCollectionsTable.tsx",
      "./components/history/ChannelRequestsTable.tsx",
      "./components/profile/TokensTable.tsx",
      "./components/project-settings/CollaboratorsTable.tsx",
      "./components/project-settings/CollectionsTable.tsx",
      "./components/project-settings/HistoryExportsTable.tsx",
      "./components/project-settings/WebhookAuthMethodsTable.tsx",
      "./components/projects/channels/ChannelsTable.tsx",
    ]);
  });

  it("a page on ListPage doesn't draw an empty state through a component", () => {
    // Lint stops the page importing EmptyState; this stops a component it imports doing it instead.
    // ponytail: one level deep; follow imports further if a nested component ever slips through.
    const onListPage = paths.filter(
      (path) => isSource(path) && !path.startsWith("./components/templates/") && imports(path, "components/templates/ListPage")
    );
    const drawers = onListPage.flatMap((page) =>
      [...sources[page]!.matchAll(/from ["']@\/(components\/[^"']+)["']/g)]
        .map(([, from]) => `./${from}.tsx`)
        .filter((child) => sources[child] && !/^\.\/components\/(primitives|templates)\//.test(child) && drawsEmptyState(child))
        .map((child) => `${page} imports ${child}`)
    );
    expect(drawers).toEqual([]);
  });

  it("only a template builds a page from PageContent", () => {
    // A page fills a template (src/components/templates/), so every page of a
    // kind lays out its title, actions, loading and empty state the same way.
    const builders = paths.filter(
      (path) => isSource(path) && !path.startsWith("./components/templates/") && sources[path]!.includes('from "@/components/primitives/PageContent"')
    );
    expectOnlyKnown(builders, [
      "./components/auth/AuthLayout.tsx",
      "./pages/admin/AdminAuditPage.tsx",
      "./pages/admin/AdminAuthProvidersPage.tsx",
      "./pages/admin/AdminCollectionsPage.tsx",
      "./pages/admin/AdminMaintenancePage.tsx",
      "./pages/admin/AdminProjectsPage.tsx",
      "./pages/admin/AdminUserEditPage.tsx",
      "./pages/admin/AdminUsersPage.tsx",
      "./pages/auth/FirstSetupPage.tsx",
      "./pages/history/ChannelRequestShowPage.tsx",
      "./pages/history/DataclipShowPage.tsx",
      "./pages/history/HistoryChannelLogsPage.tsx",
      "./pages/history/HistoryWorkOrdersPage.tsx",
      "./pages/history/RunShowPage.tsx",
      "./pages/profile/BackupCodesPage.tsx",
      "./pages/profile/CredentialsIndexPage.tsx",
      "./pages/profile/ProfilePage.tsx",
      "./pages/profile/tokens/TokensPage.tsx",
      "./pages/project-settings/ProjectSettingsPage.tsx",
      "./pages/projects/ChannelsIndexPage.tsx",
      "./pages/projects/MfaRequiredPage.tsx",
      "./pages/projects/SandboxesIndexPage.tsx",
      "./pages/projects/WorkflowHealthPage.tsx",
    ]);
  });

  it("every component has a story beside it, or is shown by a story in its folder", () => {
    const missing = components.filter((path) => {
      if (sources[path.replace(".tsx", ".stories.tsx")]) return false;
      const folder = path.slice(0, path.lastIndexOf("/") + 1);
      const name = path.slice(folder.length, -".tsx".length);
      return !paths.some((story) => story.startsWith(folder) && story.endsWith(".stories.tsx") && sources[story]!.includes(`from "./${name}"`));
    });
    expect(missing).toEqual([]);
  });

  it("every primitive gives themes a data-ui hook", () => {
    // One whose root is another primitive (IconButton renders Button) already
    // carries that one's hook; its own would replace it and break theme rules.
    // Every JSX root the default export returns must be one; `return null` is fine.
    const wrapsPrimitive = (text: string) => {
      const body = text.slice(text.indexOf("export default function"));
      const roots = [...body.matchAll(/return \(?\s*(?:\/\/[^\n]*\n\s*)*<(\w*)/g)].map((m) => m[1]!);
      const imported = (tag: string) => new RegExp(`^import ${tag}\\b.* from "\\./`, "m").test(text);
      return roots.length > 0 && roots.every(imported);
    };
    const missing = components.filter(
      (path) => path.startsWith("./components/primitives/") && !sources[path]!.includes("data-ui") && !wrapsPrimitive(sources[path]!)
    );
    expect(missing).toEqual([]);
  });

  it("every routed page has an annotations view id", () => {
    // Each <Route path> that renders a page must resolve, with its params
    // filled in, to a view id the annotations panel can show.
    const routes = [...sources["./App.tsx"]!.matchAll(/<Route path="([^"]+)" element={<\w+Page /g)];
    expect(routes.length).toBeGreaterThan(30);
    const missing = routes
      // A relative path sits under ProjectGate, the one parent route.
      .map(([, path]) => (path!.startsWith("/") ? path! : `/projects/:projectId/${path}`))
      .filter((path) => !viewIdForLocation(path.replace(/:\w+/g, "x"), "", ""));
    expect(missing).toEqual([]);
  });
});

describe("dates are formatted in one place", () => {
  it("only src/utils reads a date's parts or formats one for display", () => {
    // Use a formatter from utils/format.ts, or add one there.
    const dateParts = /\.(toLocale\w*String|getUTC\w+|get(FullYear|Month|Date|Day|Hours|Minutes|Seconds))\(|\bIntl\./;
    const missing = paths.filter(
      (path) => isSource(path) && !/^\.\/(utils|mock-data|test)\//.test(path) && dateParts.test(sources[path]!)
    );
    expect(missing).toEqual([]);
  });
});

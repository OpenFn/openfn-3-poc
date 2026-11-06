/// <reference types="vite/client" />
import type { Preview, Decorator } from "@storybook/react";
import "@/index.css";
import "@/monacoSetup";
import { DEFAULT_THEME_ID, THEMES } from "@/theme/themes";
import SessionProvider from "@/session/SessionProvider";
import { session } from "@/mock-data/users";
import ApiProvider from "@/api/ApiProvider";

/*
 * Each deploy replaces every hashed file on GitHub Pages, so a tab or cached
 * page from before it asks for story files that no longer exist ("Failed to
 * fetch dynamically imported module"). Reload once to pick up the new build;
 * the flag stops a loop if the file is really missing.
 */
if (typeof window !== "undefined") {
  const RELOADED = "storybook-reloaded-after-deploy";
  window.addEventListener("vite:preloadError", (event) => {
    try {
      if (sessionStorage.getItem(RELOADED)) return;
      sessionStorage.setItem(RELOADED, "1");
    } catch {
      return;
    }
    event.preventDefault();
    window.location.reload();
  });
  window.addEventListener("load", () => {
    setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOADED);
      } catch {
        // Storage blocked: the listener above already gave up.
      }
    }, 10000);
  });
}

/**
 * Reflects the toolbar-selected theme onto <html> so every story can be
 * previewed under any app theme — the same mechanism the app uses.
 */
const withTheme: Decorator = (Story, context) => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(
      "data-theme",
      (context.globals.theme as string) || DEFAULT_THEME_ID
    );
  }
  return <Story />;
};

/** Signs every story in as the session fixture's user, as SessionGate does for the app from the API. */
const withSession: Decorator = (Story) => (
  <SessionProvider session={session}>
    <Story />
  </SessionProvider>
);

/**
 * TanStack Query for the stories of routes, a fresh cache per story. No
 * retries, so a failed load shows at once.
 */
const withApi: Decorator = (Story, context) => (
  <ApiProvider key={context.id} retry={false}>
    <Story />
  </ApiProvider>
);

const preview: Preview = {
  parameters: {
    // The tiers first, as in src/components/ (docs/building.md), then the areas, then pages.
    // An axe violation fails the story's test (`npm run test:stories`).
    // Headless UI's focus guards are aria-hidden buttons that hand focus back to the panel; axe can't tell.
    a11y: { test: "error", context: { exclude: ["[data-headlessui-focus-guard]"] } },
    options: { storySort: { order: ["Primitives", "Domain", "Shell", "*", "Pages"] } },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "App theme",
      // STORYBOOK_THEME=light npm run test:stories runs the axe checks under another theme.
      defaultValue: import.meta.env.STORYBOOK_THEME ?? DEFAULT_THEME_ID,
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: THEMES.map((t) => ({
          value: t.id,
          title: t.id === DEFAULT_THEME_ID ? `${t.name} (default)` : t.name,
        })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme, withSession, withApi],
  // An Alert stays invisible for its first moment (Alert.tsx), and axe skips what it can't see, so wait it out.
  afterEach: async ({ canvasElement }) => {
    const hidden = () => canvasElement.ownerDocument.querySelector("[data-ui=alert].invisible");
    for (let tries = 0; tries < 50 && hidden(); tries++) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (hidden()) throw new Error("An Alert stayed hidden past 1s, so axe would skip it");
  },
};

export default preview;

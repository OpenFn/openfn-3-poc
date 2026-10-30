import { MemoryRouter } from "react-router-dom";
import { ReactRouterAdapter } from "../routing/ReactRouterAdapter";
import type { Decorator } from "@storybook/react";
import { cn } from "../utils/cn";

/**
 * Wraps a story in a MemoryRouter at a given URL, with the adapter that lets
 * components navigate through it, so location-aware components (e.g. the
 * sidebar) render that context.
 */
export const withRouterAt =
  (path: string): Decorator =>
  (Story) => (
    <MemoryRouter initialEntries={[path]}>
      <ReactRouterAdapter>
        <Story />
      </ReactRouterAdapter>
    </MemoryRouter>
  );

/** {@link withRouterAt} the root URL. */
export const withRouter = withRouterAt("/");

/**
 * A gray page background with stacked spacing, for panels that render
 * several cards (often as a fragment), e.g. the project settings panels.
 */
export const withGrayPanel: Decorator = (Story) => (
  <div className="space-y-4 bg-page p-6">
    <Story />
  </div>
);

/**
 * Pins a side panel (inspector, settings, AI assistant) to the right edge of
 * a gray area of the given height.
 */
export const withSidePanel =
  (height = "h-150"): Decorator =>
  (Story) => (
    <div className={cn("flex justify-end bg-page", height)}>
      <Story />
    </div>
  );

/** A padded white tile of the given width, for charts and small cards. */
export const withWhitePanel =
  (width = "w-96"): Decorator =>
  (Story) => (
    <div className={cn("bg-surface p-6", width)}>
      <Story />
    </div>
  );

/**
 * A positioned gray area of the given height, for overlays that sit
 * absolutely on the workflow canvas (controls, minimap, mini history).
 */
export const withCanvas =
  (height: string): Decorator =>
  (Story) => (
    <div className={cn("relative bg-page", height)}>
      <Story />
    </div>
  );

/**
 * Story parameters for the workflow diagram: axe's colour-contrast check is
 * off. The diagram keeps Lightning's greys, where a faded node or a grey edge
 * label means disabled or not reached, and lifting only the text read worse
 * than the fade. Every other check still runs.
 */
export const diagramParameters = { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } };

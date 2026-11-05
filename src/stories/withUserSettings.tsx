import type { Decorator } from "@storybook/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import UserSettings from "@/components/shell/UserSettings.query";

/**
 * A page of the user's own settings at its URL, inside the layout route that
 * frames it in the app, so the story shows the real menu with its section
 * marked. Its own file, so other stories don't load the shell.
 */
export const withUserSettingsAt =
  (path: string): Decorator =>
  (Story) => (
    <MemoryRouter initialEntries={[path]}>
      <ReactRouterAdapter>
        <Routes>
          <Route element={<UserSettings />}>
            <Route path="*" element={<Story />} />
          </Route>
        </Routes>
      </ReactRouterAdapter>
    </MemoryRouter>
  );

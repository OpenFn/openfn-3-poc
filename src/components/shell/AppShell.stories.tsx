import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AppShell from "./AppShell.query";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { projects } from "@/mock-data/projects";

const meta: Meta = { title: "Shell/AppShell", parameters: { layout: "fullscreen" } };
export default meta;

const Body = () => (
  <PageContent header={<Header title="Page" />}>
    <Centered>
      <p className="text-sm text-muted">Page body</p>
    </Centered>
  </PageContent>
);

const at = (path: string) => () => (
  <MemoryRouter initialEntries={[path]}>
    <ReactRouterAdapter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/projects/:projectId/*" element={<Body />} />
          <Route path="*" element={<Body />} />
        </Route>
      </Routes>
    </ReactRouterAdapter>
  </MemoryRouter>
);

const inProject = at(`/projects/${projects[0]!.id}/w`);
export const Project: StoryObj = { render: inProject };
/** Toggled to icons only. */
export const ProjectCollapsed: StoryObj = {
  render: inProject,
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button", { name: "Toggle sidebar" }));
    await expect(canvasElement.querySelector("#sidebar-panel")).toHaveAttribute("data-collapsed", "true");
  },
};
export const Profile: StoryObj = { render: at("/profile") };
export const Admin: StoryObj = { render: at("/settings/projects") };

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "@/routing/router";
import type { WorkflowListItem } from "@/types/workflows";
import WorkflowsIndexPage from "./WorkflowsIndexPage";

const workflows: WorkflowListItem[] = [
  { id: "w1", name: "Referrals", updatedAt: "2026-10-01T10:00:00Z", lastWorkOrder: { state: "failed", updatedAt: "2026-10-14T06:00:00Z" } },
  { id: "w2", name: "Facility sync", updatedAt: "2026-09-01T10:00:00Z", lastWorkOrder: null },
];

function renderPage(props: Partial<React.ComponentProps<typeof WorkflowsIndexPage>> = {}) {
  const router: Router = { navigate: vi.fn(), useHref: (to) => to, useLocation: () => ({ pathname: "/projects/p1/w", search: "", hash: "" }) };
  const onSort = vi.fn();
  render(
    <RouterProvider value={router}>
      <WorkflowsIndexPage
        project={{ id: "p1", parentId: null, color: null }}
        projectLabel="malawi-hiv"
        workflows={workflows}
        sort={{ key: "name", direction: "asc" }}
        onSort={onSort}
        canCreateWorkflow
        {...props}
      />
    </RouterProvider>
  );
  return { onSort };
}

describe("WorkflowsIndexPage", () => {
  it("lists each workflow with its latest run, linking to its editor", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /Workflows/ }).textContent).toContain("2");
    const row = screen.getByText("Referrals").closest("tr")!;
    expect(row.textContent).toContain("Failed");
    expect(screen.getByRole("link", { name: "Referrals" }).getAttribute("href")).toBe("/projects/p1/w/w1");
    expect(screen.getByText("Facility sync").closest("tr")!.textContent).toContain("Nothing last 30 days");
  });

  it("passes a header click on to onSort", () => {
    const { onSort } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("with no workflows, Create stays in the header and the empty state is words only", () => {
    renderPage({ workflows: [] });
    expect(screen.getByText("No workflows found. Create one to start automating.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /Create/ })).toHaveLength(1);
  });

  it("disables Create for someone who can't create workflows", () => {
    renderPage({ canCreateWorkflow: false });
    expect(screen.queryByRole("link", { name: "Create new workflow" })).toBeNull();
    expect(screen.getByText("Create new workflow").closest("button, a, [aria-disabled]")).toBeTruthy();
  });
});

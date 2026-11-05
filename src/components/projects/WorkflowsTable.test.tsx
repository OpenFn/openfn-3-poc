import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "@/routing/router";
import WorkflowsTable from "./WorkflowsTable";

const router: Router = { navigate: vi.fn(), useHref: (to) => to, useLocation: () => ({ pathname: "/projects/p1/w", search: "", hash: "" }) };
const workflows = [{ id: "w1", name: "Referrals", updatedAt: "2026-10-01T10:00:00Z", lastWorkOrder: null }];

describe("WorkflowsTable", () => {
  it("flips the sorted column's order, starts another ascending, and marks the sorted column", () => {
    const onSort = vi.fn();
    render(
      <RouterProvider value={router}>
        <WorkflowsTable projectId="p1" workflows={workflows} sort={{ key: "name", direction: "asc" }} onSort={onSort} />
      </RouterProvider>
    );
    expect(screen.getByRole("columnheader", { name: /Name/ }).getAttribute("aria-sort")).toBe("ascending");
    expect(screen.getByRole("columnheader", { name: /Last updated/ }).getAttribute("aria-sort")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Name/ }));
    expect(onSort).toHaveBeenLastCalledWith({ key: "name", direction: "desc" });
    fireEvent.click(screen.getByRole("button", { name: /Last updated/ }));
    expect(onSort).toHaveBeenLastCalledWith({ key: "updated_at", direction: "asc" });
  });
});

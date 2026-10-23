import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "../routing/router";
import { Th } from "./Table";

describe("Th", () => {
  it("links a sortable header through the router, and sorts on a left click", () => {
    const router: Router = {
      navigate: vi.fn(),
      useHref: (to) => "#" + to,
      useLocation: () => ({ pathname: "/projects/p1/w", search: "", hash: "" }),
    };
    const onSort = vi.fn();
    render(
      <RouterProvider value={router}>
        <table>
          <thead>
            <tr>
              <Th onSort={onSort} sortHref="/projects/p1/w?sort=name&dir=asc" sortDirection={null}>
                Name
              </Th>
            </tr>
          </thead>
        </table>
      </RouterProvider>
    );
    const link = screen.getByRole("link", { name: /Name/ });
    expect(link.getAttribute("href")).toBe("#/projects/p1/w?sort=name&dir=asc");
    fireEvent.click(link);
    expect(onSort).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

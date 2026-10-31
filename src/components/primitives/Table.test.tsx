import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "../../routing/router";
import { Table, Th } from "./Table";

describe("Th", () => {
  it("links a server-sorted header through the router", () => {
    const router: Router = {
      navigate: vi.fn(),
      useHref: (to) => "#" + to,
      useLocation: () => ({ pathname: "/projects/p1/w", search: "", hash: "" }),
    };
    render(
      <RouterProvider value={router}>
        <table>
          <thead>
            <tr>
              <Th sortHref="/projects/p1/w?sort=name&dir=asc" sortDirection={null}>
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
    expect(router.navigate).toHaveBeenCalledWith("/projects/p1/w?sort=name&dir=asc", { replace: false });
  });
});

describe("Table state", () => {
  const header = (
    <tr>
      <th>Name</th>
    </tr>
  );

  it("shows the loading message as a status instead of the rows", () => {
    render(
      <Table header={header} state="loading" loadingMessage="Loading work orders ...">
        <tr>
          <td>A row</td>
        </tr>
      </Table>
    );
    expect(screen.getByRole("status").textContent).toBe("Loading work orders ...");
    expect(screen.queryByText("A row")).toBeNull();
  });

  it("shows the error message instead of the rows", () => {
    render(
      <Table header={header} state="error" errorMessage="There was an error loading the work orders">
        <tr>
          <td>A row</td>
        </tr>
      </Table>
    );
    expect(screen.getByText("There was an error loading the work orders")).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByText("A row")).toBeNull();
  });
});

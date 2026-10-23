import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "../routing/router";
import Pagination from "./Pagination";

const hashRouter = (): Router => ({
  navigate: vi.fn(),
  useHref: (to) => "#" + to,
  useLocation: () => ({ pathname: "/projects/p1/history/channels", search: "", hash: "" }),
});

describe("Pagination", () => {
  it("links pages through the router, so they stay inside a hash-routed app", () => {
    const router = hashRouter();
    render(
      <RouterProvider value={router}>
        <Pagination pageNumber={1} pageSize={10} totalEntries={25} pageHref={(n) => `/projects/p1/history/channels?page=${n}`} />
      </RouterProvider>
    );
    const page2 = screen.getByRole("link", { name: "2" });
    expect(page2.getAttribute("href")).toBe("#/projects/p1/history/channels?page=2");
    fireEvent.click(page2);
    expect(router.navigate).toHaveBeenCalledWith("/projects/p1/history/channels?page=2", { replace: false });
  });

  it("sends a left click to onPage instead of navigating", () => {
    const router = hashRouter();
    const onPage = vi.fn();
    render(
      <RouterProvider value={router}>
        <Pagination pageNumber={1} pageSize={10} totalEntries={25} pageHref={(n) => `?page=${n}`} onPage={onPage} />
      </RouterProvider>
    );
    fireEvent.click(screen.getByRole("link", { name: "3" }));
    expect(onPage).toHaveBeenCalledWith(3);
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

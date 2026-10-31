import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("is announced as a status only while loading", () => {
    const { rerender } = render(<EmptyState variant="plain" loading message="Loading ..." />);
    expect(screen.getByRole("status").textContent).toBe("Loading ...");
    rerender(<EmptyState variant="plain" message="Nothing here" />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("drops the dashed box's default icon when icon is null", () => {
    const { container, rerender } = render(<EmptyState message="No sandboxes found" />);
    expect(container.querySelector(".hero-plus-circle")).not.toBeNull();
    rerender(<EmptyState icon={null} message="No sandboxes found" />);
    expect(container.querySelector("[class*=hero-]")).toBeNull();
  });
});

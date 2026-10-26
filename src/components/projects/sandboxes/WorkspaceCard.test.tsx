import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../../../test/tooltip";
import type { SandboxRow } from "../../../types/sandboxes";
import WorkspaceCard from "./WorkspaceCard";

const deleted: SandboxRow = {
  id: "s1",
  name: "staging",
  color: null,
  env: null,
  scheduledDeletion: "2026-11-01T00:00:00Z",
  workflowsHref: "/projects/s1/w",
  editHref: "/projects/p1/sandboxes/s1/edit",
  canEdit: false,
  canDelete: false,
  canMerge: false,
  canCancelDeletion: true,
  restoreBlockedReason: null,
  activeDescendantCount: 0,
};

describe("WorkspaceCard", () => {
  it("says when a sandbox scheduled for deletion goes, in a tooltip", async () => {
    render(<WorkspaceCard workspace={deleted} />);
    const name = screen.getByRole("heading", { name: "staging" }).parentElement!;
    expect(name.tagName).toBe("DIV"); // A heading inside a span is invalid HTML.
    expect(name.getAttribute("title")).toBeNull();
    expect(name.closest("[aria-disabled]")!.getAttribute("aria-description")).toMatch(/^Scheduled for deletion on /);
    await hover(name);
    expect(openTooltips()).toEqual([expect.stringMatching(/^Scheduled for deletion on /)]);
  });

  it("shows only a badge's own tooltip on a sandbox scheduled for deletion", async () => {
    render(<WorkspaceCard workspace={{ ...deleted, env: "qa" }} />);
    await hover(screen.getByText("qa"));
    expect(openTooltips()).toEqual(["qa"]);
  });
});

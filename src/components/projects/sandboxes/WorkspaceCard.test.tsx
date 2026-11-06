import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { hover, openTooltips } from "@/test/tooltip";
import WorkspaceCard from "./WorkspaceCard";

const scheduled = storyWorkspace[2]!;

describe("WorkspaceCard", () => {
  it("says when a sandbox scheduled for deletion goes, in a tooltip", async () => {
    render(<WorkspaceCard sandbox={scheduled} />);
    const name = screen.getByRole("heading", { name: "old-import-test" }).parentElement!;
    expect(name.tagName).toBe("DIV"); // A heading inside a span is invalid HTML.
    expect(name.closest("[aria-description]")!.getAttribute("aria-description")).toMatch(/^Scheduled for deletion on /);
    await hover(name);
    expect(openTooltips()).toEqual([expect.stringMatching(/^Scheduled for deletion on /)]);
  });
});

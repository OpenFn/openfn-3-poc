import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../../test/tooltip";
import MiniHistory from "./MiniHistory";

const renderCard = () =>
  render(
    <MiniHistory
      projectId="p1"
      workflowId="w1"
      collapsed
      onToggle={() => {}}
      history={[]}
      selectedRunId={null}
      onSelectRun={() => {}}
      onDeselectRun={() => {}}
    />
  );

describe("MiniHistory", () => {
  it("shows only the link's own tooltip on the full history link", async () => {
    renderCard();
    await hover(screen.getByRole("link", { name: "View full history for this workflow" }));
    expect(openTooltips()).toEqual(["View full history for this workflow"]);
  });

  it("shows the shortcut on the heading", async () => {
    renderCard();
    const heading = screen.getByRole("heading", { name: "View History" });
    expect(heading.parentElement!.tagName).toBe("DIV"); // A heading inside a span is invalid HTML.
    await hover(heading);
    expect(openTooltips()).toEqual(["⌘ H"]);
  });
});

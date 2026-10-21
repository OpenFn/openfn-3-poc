import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import CloseButton from "./CloseButton";

describe("CloseButton", () => {
  it("shows no tooltip, but keeps its name", async () => {
    render(<CloseButton label="Close panel" />);
    await hover(screen.getByRole("button", { name: "Close panel" }));
    expect(openTooltips()).toEqual([]);
  });
});

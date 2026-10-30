import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { hover, openTooltips } from "../../test/tooltip";
import IconButton from "./IconButton";
import Modal from "./Modal";

describe("Modal", () => {
  it("closes on the first Escape, with no tooltip on its X to take it", () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose} title="Delete project">Sure?</Modal>);
    // A browser moves focus to the X, the first focusable element; jsdom stops at the dialog, so focus it here.
    const close = screen.getByRole("button", { name: "Close" });
    act(() => close.focus());
    expect(openTooltips()).toEqual([]);
    fireEvent.keyDown(close, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on the first Escape while a tooltip inside it is open", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Delete project">
        <IconButton icon="hero-trash" label="Delete" />
      </Modal>
    );
    const del = screen.getByRole("button", { name: "Delete" });
    await hover(del);
    expect(openTooltips()).toEqual(["Delete"]);
    fireEvent.keyDown(del, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

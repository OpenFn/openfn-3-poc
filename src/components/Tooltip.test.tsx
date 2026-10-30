import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import CopyButton from "./CopyButton";
import Tooltip from "./Tooltip";

// jsdom counts every focus as :focus-visible, so each test says which kind of focus it is.
const focusVisible = (visible: boolean) => {
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    return selector === ":focus-visible" ? visible : matches.call(this, selector);
  });
};

describe("Tooltip", () => {
  afterEach(() => vi.restoreAllMocks());

  it("opens on keyboard focus", () => {
    focusVisible(true);
    render(<Tooltip content="More options"><button>…</button></Tooltip>);
    act(() => screen.getByRole("button").focus());
    expect(openTooltips()).toEqual(["More options"]);
  });

  it("stays shut when a menu or dialog closed by mouse hands focus back", () => {
    focusVisible(false);
    render(<Tooltip content="More options"><button>…</button></Tooltip>);
    act(() => screen.getByRole("button").focus());
    expect(openTooltips()).toEqual([]);
  });

  it("keeps the child focused when its text comes and goes", () => {
    const { rerender } = render(<Tooltip content={undefined}><button>…</button></Tooltip>);
    const button = screen.getByRole("button");
    act(() => button.focus());
    rerender(<Tooltip content="Disabled"><button>…</button></Tooltip>);
    rerender(<Tooltip content={undefined}><button>…</button></Tooltip>);
    expect(screen.getByRole("button")).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it("stays shut when its text arrives after a hover with none", async () => {
    const { rerender } = render(<Tooltip content={undefined}><button>…</button></Tooltip>);
    const button = screen.getByRole("button");
    await hover(button);
    fireEvent.mouseLeave(button);
    rerender(<Tooltip content="Disabled"><button>…</button></Tooltip>);
    expect(openTooltips()).toEqual([]);
  });

  it("leaves another tooltip open when the mouse moves over a child with no text", async () => {
    render(
      <>
        <Tooltip content="A"><button>A</button></Tooltip>
        <Tooltip content={undefined}><button>B</button></Tooltip>
      </>
    );
    await hover(screen.getByRole("button", { name: "A" }));
    await hover(screen.getByRole("button", { name: "B" }));
    expect(openTooltips()).toEqual(["A"]);
  });

  it("passes the child's own ref through", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Tooltip content="Save"><button ref={ref}>Save</button></Tooltip>);
    expect(ref.current).toBe(screen.getByRole("button"));
  });

  it("lets the keyboard reach a disabled control's reason, and ignores the control's press", () => {
    focusVisible(true);
    const onClick = vi.fn();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Tooltip content="Contact an editor or admin to sync." disabled>
          <button type="submit" disabled onClick={onClick}>Sync</button>
        </Tooltip>
      </form>
    );
    const button = screen.getByRole("button", { name: "Sync" });
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
    expect(openTooltips()).toEqual(["Contact an editor or admin to sync."]);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.getAttribute("aria-description")).toBe("Contact an editor or admin to sync.");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("leaves a disabled field natively disabled, so it can't be typed in", () => {
    render(
      <Tooltip content="Read only" disabled>
        <input aria-label="Name" disabled />
      </Tooltip>
    );
    const input = screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
    expect(input.disabled).toBe(true);
    expect(input.getAttribute("aria-disabled")).toBeNull();
  });

  it("keeps the same button when the control is enabled and disabled again", () => {
    const { rerender } = render(<Tooltip content="Type the name first" disabled><button disabled>Delete</button></Tooltip>);
    const button = screen.getByRole("button");
    rerender(<Tooltip content={undefined} disabled={false}><button>Delete</button></Tooltip>);
    expect(screen.getByRole("button")).toBe(button);
    rerender(<Tooltip content="Type the name first" disabled><button disabled>Delete</button></Tooltip>);
    expect(screen.getByRole("button")).toBe(button);
  });

  it("shows the tooltip around a child with no text of its own", async () => {
    render(
      <Tooltip content="Outer">
        <button>
          <Tooltip content={undefined}><span>inner</span></Tooltip>
        </button>
      </Tooltip>
    );
    await hover(screen.getByText("inner"));
    expect(openTooltips()).toEqual(["Outer"]);
  });

  it("closes one opened by keyboard focus when another opens on hover", async () => {
    focusVisible(true);
    render(
      <>
        <Tooltip content="A"><button>A</button></Tooltip>
        <Tooltip content="B"><button>B</button></Tooltip>
      </>
    );
    act(() => screen.getByRole("button", { name: "A" }).focus());
    await hover(screen.getByRole("button", { name: "B" }));
    expect(openTooltips()).toEqual(["B"]);
  });

  it("stays shut when its text goes while open and comes back", async () => {
    const { rerender } = render(<Tooltip content="Disabled"><button>…</button></Tooltip>);
    const button = screen.getByRole("button");
    await hover(button);
    rerender(<Tooltip content={undefined}><button>…</button></Tooltip>);
    fireEvent.mouseLeave(button);
    rerender(<Tooltip content="Disabled"><button>…</button></Tooltip>);
    expect(openTooltips()).toEqual([]);
  });

  it("closes when its trigger is pressed", async () => {
    render(<Tooltip content="More options"><button>…</button></Tooltip>);
    const button = screen.getByRole("button");
    await hover(button);
    fireEvent.pointerDown(button);
    expect(openTooltips()).toEqual([]);
    // Moving the mouse on the trigger doesn't bring it back.
    fireEvent.mouseMove(button);
    await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(openTooltips()).toEqual([]);
  });

  it("copies on click, says so, and keeps the click from the row around it", async () => {
    const onRowClick = vi.fn();
    render(
      <div onClick={onRowClick}>
        <Tooltip content="2026-10-14 08:30:07 UTC" copy="2026-10-14 08:30:07 UTC"><span>today</span></Tooltip>
      </div>
    );
    const time = screen.getByText("today");
    await hover(time);
    fireEvent.pointerDown(time);
    // The press doesn't close it, so it doesn't blink before "Copied!".
    expect(openTooltips()).toEqual(["2026-10-14 08:30:07 UTC"]);
    fireEvent.click(time);
    expect(openTooltips()).toEqual(["Copied!"]);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("doesn't repeat a control's name as its description", async () => {
    render(
      <>
        <Tooltip content="Delete">
          <button aria-label="Delete">x</button>
        </Tooltip>
        <Tooltip content="Close IDE (Esc)">
          <button aria-label="Close IDE">x</button>
        </Tooltip>
        <Tooltip content="Run" disabled>
          <button aria-label="Run" disabled>x</button>
        </Tooltip>
      </>
    );
    await hover(screen.getByRole("button", { name: "Delete" }));
    expect(openTooltips()).toEqual(["Delete"]);
    expect(screen.getByRole("button", { name: "Delete" }).getAttribute("aria-describedby")).toBeNull();
    await hover(screen.getByRole("button", { name: "Close IDE" }));
    expect(screen.getByRole("button", { name: "Close IDE" }).getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run" }).getAttribute("aria-description")).toBeNull();
  });

  it("doesn't describe an IconButton by the label it is already named by", async () => {
    render(<CopyButton value="abc" label="Copy id" />);
    const button = screen.getByRole("button", { name: "Copy id" });
    await hover(button);
    expect(openTooltips()).toEqual(["Copy id"]);
    expect(button.getAttribute("aria-describedby")).toBeNull();
  });
});

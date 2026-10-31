/// <reference types="node" />
import { readFileSync } from "node:fs";
import { composeStories } from "@storybook/react-vite";
import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { hover, openTooltips } from "../../test/tooltip";
import Button from "./Button";
import * as stories from "./Button.stories";

describe("Button", () => {
  it("passes a disabled button's hover to the wrapper that shows its reason", async () => {
    render(<Button disabled tooltip="You can't do that">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.parentElement!.classList).toContain("cursor-not-allowed");
    expect(button.parentElement!.classList).toContain("*:pointer-events-none");
    await hover(button.parentElement!);
    expect(openTooltips()).toEqual(["You can't do that"]);
  });

  it("blocks a second click while its request runs, and keeps the focus it had", () => {
    const onClick = vi.fn();
    const onParentClick = vi.fn();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const form = (pending: boolean) => (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- catches the click that bubbles out of the button
      <div onClick={onParentClick}>
        <form onSubmit={onSubmit}>
          <Button type="submit" pending={pending} onClick={onClick}>Save</Button>
        </form>
      </div>
    );
    const { rerender } = render(form(false));
    const button = screen.getByRole<HTMLButtonElement>("button", { name: /Save/ });
    act(() => button.focus());
    rerender(form(true));
    expect(document.activeElement).toBe(button);
    // jsdom keeps focus on a natively disabled button, so check it isn't one.
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText("Working")).toBeTruthy();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("keeps a caller's aria-disabled when it isn't pending", () => {
    render(<Button aria-disabled>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("hands its ref the link it renders", () => {
    const toRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    const hrefRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
    render(
      <>
        <Button ref={toRef} to="/projects">Projects</Button>
        <Button ref={hrefRef} href="https://docs.openfn.org">Docs</Button>
      </>
    );
    expect(toRef.current).toBe(screen.getByRole("link", { name: "Projects" }));
    expect(hrefRef.current).toBe(screen.getByRole("link", { name: "Docs" }));
  });

  it("can't be followed when a link is disabled", () => {
    render(
      <>
        <Button to="/projects" disabled>Projects</Button>
        <Button href="https://docs.openfn.org" disabled>Docs</Button>
      </>
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Projects" }).disabled).toBe(true);
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Docs" }).disabled).toBe(true);
  });

  it("doesn't send the referrer to a page it opens in a new tab", () => {
    render(<Button href="https://docs.openfn.org" target="_blank">Docs</Button>);
    expect(screen.getByRole("link", { name: "Docs" }).getAttribute("rel")).toBe("noreferrer");
  });

  it("takes a tone only on the filled button", () => {
    // @ts-expect-error -- a secondary button has no tone (docs/building.md, Prop names); typecheck fails if it gains one.
    void (<Button variant="secondary" tone="danger">Delete</Button>);
    // @ts-expect-error -- a plain button is red or nothing.
    void (<Button variant="plain" tone="success">Connect</Button>);
  });

  it("shows the spinner in place of its icon while pending", () => {
    const { container } = render(<Button icon="hero-play-solid" pending>Run</Button>);
    expect(screen.getByLabelText("Working")).toBeTruthy();
    expect(container.querySelector(".hero-play-solid")).toBeNull();
  });

  it("carries the data-ui, data-variant and data-tone hooks the themes style", () => {
    render(<Button tone="danger">Delete</Button>);
    const danger = screen.getByRole("button", { name: "Delete" });
    expect(danger.getAttribute("data-ui")).toBe("button");
    expect(danger.getAttribute("data-variant")).toBe("primary");
    expect(danger.getAttribute("data-tone")).toBe("danger");
  });

  it("leaves the focus halo on top of the default theme's lift", () => {
    // Read from disk: Vitest hands CSS imports, ?raw too, over empty.
    const themeCss = readFileSync("src/theme/theme.css", "utf8");
    // A bare :not() adds a class's weight, so the lift's primary and secondary box-shadows would
    // outrank the halo (`:is(a, button, …):focus-visible`) and a focused Save would show nothing.
    expect(themeCss).not.toMatch(/\[data-ui="button"\]:not\(/);
    expect(themeCss).toContain('[data-ui="button"]:where(:not([data-variant="plain"])) {');
  });

  it("drops the themes' hover and press on a pending button and one disabled with a reason", () => {
    const themeCss = readFileSync("src/theme/theme.css", "utf8");
    // Those buttons are aria-disabled, not :disabled, so every disabled rule has to match both.
    expect(themeCss.replaceAll(':is(:disabled, [aria-disabled="true"])', "")).not.toContain(":disabled");
  });

  it("shows plain text buttons on white in its stories, where they pass 4.5:1", () => {
    const { Plain, AllLooks } = composeStories(stories);
    for (const Story of [Plain, AllLooks]) {
      const { unmount } = render(<Story />);
      for (const button of screen.getAllByRole("button").filter((b) => b.getAttribute("data-variant") === "plain")) {
        expect(button.closest(".bg-surface")).not.toBeNull();
      }
      unmount();
    }
  });

  it("puts the icon after the label with iconPosition right", () => {
    render(<Button icon="hero-arrow-right" iconPosition="right">Build it</Button>);
    expect(screen.getByRole("button").firstChild?.textContent).toBe("Build it");
  });
});

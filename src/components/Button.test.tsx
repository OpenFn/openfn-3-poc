/// <reference types="node" />
import { readFileSync } from "node:fs";
import { composeStories } from "@storybook/react-vite";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
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

  it("blocks a second click while its request runs", () => {
    render(<Button pending>Save</Button>);
    const button = screen.getByRole<HTMLButtonElement>("button", { name: /Save/ });
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(screen.getByLabelText("Working")).toBeTruthy();
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
    // @ts-expect-error -- a secondary button has no tone (src/components/CLAUDE.md, Prop names); typecheck fails if it gains one.
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

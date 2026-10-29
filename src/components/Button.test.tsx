import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { hover, openTooltips } from "../test/tooltip";
import Button from "./Button";

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
    // @ts-expect-error -- a secondary button has no tone (CLAUDE.md, Prop names); typecheck fails if it gains one.
    void (<Button variant="secondary" tone="danger">Delete</Button>);
    // @ts-expect-error -- a plain button is red or nothing.
    void (<Button variant="plain" tone="success">Connect</Button>);
  });

  it("shows the spinner in place of its icon while pending", () => {
    const { container } = render(<Button icon="hero-play-solid" pending>Run</Button>);
    expect(screen.getByLabelText("Working")).toBeTruthy();
    expect(container.querySelector(".hero-play-solid")).toBeNull();
  });

  it("puts the icon after the label with iconPosition right", () => {
    render(<Button icon="hero-arrow-right" iconPosition="right">Build it</Button>);
    expect(screen.getByRole("button").firstChild?.textContent).toBe("Build it");
  });
});

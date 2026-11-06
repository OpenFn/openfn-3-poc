import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Alert from "./Alert";

// `invisible` is the behaviour here: it hides the message from screen readers until the region is in the page.
const hidden = (text: string) => screen.getByText(text).closest("[data-ui=alert]")!.classList.contains("invisible");

describe("Alert", () => {
  it("puts its live region in the page before showing the message, so screen readers read it out", async () => {
    render(<Alert tone="success">Credential scheduled for deletion</Alert>);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(hidden("Credential scheduled for deletion")).toBe(true);
    await waitFor(() => expect(hidden("Credential scheduled for deletion")).toBe(false));
  });

  it("hides the same message again under a new key, so it is read again", async () => {
    const { rerender } = render(<Alert key={1} tone="success">Saved</Alert>);
    await waitFor(() => expect(hidden("Saved")).toBe(false));
    rerender(<Alert key={2} tone="success">Saved</Alert>);
    expect(hidden("Saved")).toBe(true);
    await waitFor(() => expect(hidden("Saved")).toBe(false));
  });

  it("interrupts for danger and waits its turn for the rest", () => {
    const { rerender } = render(<Alert tone="danger">Couldn't delete</Alert>);
    expect(screen.getByRole("alert")).toBeTruthy();
    for (const tone of ["info", "success", "warning"] as const) {
      rerender(<Alert tone={tone}>Note</Alert>);
      expect(screen.getByRole("status")).toBeTruthy();
    }
  });
});

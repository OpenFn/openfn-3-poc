import { act, fireEvent, screen } from "@testing-library/react";

// jsdom has no ResizeObserver, and Floating UI watches the open tooltip with one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/** Moves a mouse onto `el` from outside the page, as a browser does: `mouseenter` on each ancestor, outermost first, then on it. Then waits out the tooltip's delay. */
export async function hover(el: Element) {
  const path: Element[] = [];
  for (let node: Element | null = el; node; node = node.parentElement) path.unshift(node);
  path.forEach((node) => fireEvent.mouseEnter(node));
  await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
}

/** The text of every open tooltip. */
export const openTooltips = () => screen.queryAllByRole("tooltip").map((t) => t.textContent);

/** Hovers `el`, reads its tooltip, then moves the mouse off again. Null when none opens. */
export async function tooltipOf(el: Element) {
  await hover(el);
  const text = openTooltips().at(-1) ?? null;
  await act(async () => {
    fireEvent.mouseLeave(el);
  });
  return text;
}

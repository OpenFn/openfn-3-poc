import { act, fireEvent, screen, waitFor } from "@testing-library/react";

/**
 * Opens a `Select` (its button), clicks the option named `name`, as a mouse
 * user picks one, and waits for the list to close.
 */
export async function pickOption(select: HTMLElement, name: string | RegExp) {
  await act(async () => {
    fireEvent.click(select);
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("option", { name }));
  });
  await waitFor(() => {
    if (screen.queryByRole("listbox")) throw new Error("The list is still open");
  });
}

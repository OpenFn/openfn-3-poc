import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Button from "./Button";
import Menu, { MenuItem, MenuSection } from "./Menu";

describe("Menu", () => {
  it("names a section's group by its heading", async () => {
    render(
      <Menu trigger={<Button>Open</Button>}>
        <MenuSection heading="Account">
          <MenuItem onClick={() => {}}>Sign out</MenuItem>
        </MenuSection>
      </Menu>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(await screen.findByRole("group", { name: "Account" })).toBeTruthy();
  });

  it("reaches a disabled item with the arrow keys and reads its reason, but choosing it does nothing", async () => {
    render(
      <Menu trigger={<Button>Open</Button>}>
        <MenuItem>Edit</MenuItem>
        <MenuItem to="/projects/p1/delete" disabled description="Only project owners can delete this">
          Delete
        </MenuItem>
      </Menu>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const menu = await screen.findByRole("menu");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    const blocked = screen.getByRole("menuitem", { name: "Delete", description: "Only project owners can delete this" });
    expect(menu.getAttribute("aria-activedescendant")).toBe(blocked.id);
    expect(blocked.getAttribute("aria-disabled")).toBe("true");
    expect(blocked.getAttribute("href")).toBeNull();

    for (const choose of [() => fireEvent.keyDown(menu, { key: "Enter" }), () => fireEvent.keyDown(menu, { key: " " }), () => fireEvent.click(blocked)]) {
      choose();
      expect(screen.getByRole("button", { name: "Open" }).getAttribute("aria-expanded")).toBe("true");
      expect(menu.getAttribute("aria-activedescendant")).toBe(blocked.id);
    }
  });
});

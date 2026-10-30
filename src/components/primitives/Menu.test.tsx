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
});

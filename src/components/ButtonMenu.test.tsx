import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ButtonMenu from "./ButtonMenu";
import { MenuItem } from "./Menu";

describe("ButtonMenu", () => {
  it("doesn't open while pending", () => {
    render(
      <ButtonMenu label="Actions" pending>
        <MenuItem onClick={() => {}}>Edit</MenuItem>
      </ButtonMenu>
    );
    const trigger = screen.getByRole("button", { name: /Actions/ });
    fireEvent.keyDown(trigger, { key: "Enter" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

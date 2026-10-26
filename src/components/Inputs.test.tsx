import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { pickOption } from "../test/select";
import { Select } from "./Inputs";

const roles: [string, string][] = [
  ["Viewer", "viewer"],
  ["Editor", "editor"],
  ["Admin", "admin"],
];

/** A Select that keeps its value, as a page would. */
function Controlled({
  initial = "",
  onChange = () => {},
  ...rest
}: {
  initial?: string;
  onChange?: (v: string) => void;
  prompt?: string;
  options?: [string, string][];
}) {
  const [value, setValue] = useState(initial);
  return (
    <Select
      id="role"
      label="Role"
      options={roles}
      {...rest}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}

const key = async (k: string) => {
  await act(async () => {
    fireEvent.keyDown(document.activeElement!, { key: k });
  });
};
const open = async (select: HTMLElement) => {
  await act(async () => {
    fireEvent.click(select);
  });
};
const options = () => screen.queryAllByRole("option").map((o) => [o.textContent, o.getAttribute("aria-selected")]);

describe("Select", () => {
  it("is named by its label and then the chosen option, and keeps the field's id", () => {
    render(<Controlled initial="editor" />);
    const select = screen.getByRole("button", { name: "Role Editor" });
    expect(select.id).toBe("role");
    expect(screen.getByLabelText(/Role/)).toBe(select);
  });

  it("is named by aria-label when it has no visible label", () => {
    render(<Select aria-label="History Retention Period" prompt="Select Period" options={["7", "30"]} value="" />);
    expect(screen.getByRole("button", { name: "History Retention Period Select Period" })).toBeTruthy();
    expect(screen.getByLabelText("History Retention Period").tagName).toBe("BUTTON");
  });

  it("picks with the keyboard: arrows move, Enter chooses, focus goes back to the button", async () => {
    const onChange = vi.fn();
    render(<Controlled initial="viewer" onChange={onChange} />);
    const select = screen.getByRole("button", { name: /Role/ });
    select.focus();
    await key("ArrowDown");
    expect(screen.getByRole("listbox")).toBeTruthy();
    await key("ArrowDown");
    await key("Enter");
    expect(onChange).toHaveBeenCalledWith("editor");
    expect(document.activeElement).toBe(select);
    expect(select.textContent).toBe("Editor");
  });

  // Type-ahead is Headless UI's too, but it reads innerText, which jsdom lacks.
  it("jumps with End and Home, and Escape closes without changing the value", async () => {
    const onChange = vi.fn();
    render(<Controlled initial="viewer" onChange={onChange} />);
    const select = screen.getByRole("button", { name: /Role/ });
    const active = () => screen.getByRole("listbox").getAttribute("aria-activedescendant");
    select.focus();
    await key("ArrowDown");
    await key("End");
    expect(active()).toBe(screen.getByRole("option", { name: "Admin" }).id);
    await key("Home");
    expect(active()).toBe(screen.getByRole("option", { name: "Viewer" }).id);
    await key("Escape");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(select);
  });

  it("picks with the mouse and ticks only the chosen option", async () => {
    const onChange = vi.fn();
    render(<Controlled initial="viewer" onChange={onChange} />);
    const select = screen.getByRole("button", { name: /Role/ });
    await pickOption(select, "Admin");
    expect(onChange).toHaveBeenCalledWith("admin");
    await open(select);
    expect(options()).toEqual([
      ["Viewer", "false"],
      ["Editor", "false"],
      ["Admin", "true"],
    ]);
  });

  it("doesn't report a change when the chosen option is picked again", async () => {
    const onChange = vi.fn();
    render(<Controlled initial="viewer" onChange={onChange} />);
    await pickOption(screen.getByRole("button", { name: /Role/ }), "Viewer");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows the prompt and ticks nothing when the value matches no option, rather than the first option", async () => {
    render(<Controlled initial="owner" prompt="Select Role" />);
    const select = screen.getByRole("button", { name: /Role/ });
    expect(select.textContent).toBe("Select Role");
    await open(select);
    expect(options().every(([, selected]) => selected === "false")).toBe(true);
  });

  it("shows the prompt, and no options to pick, when there are none", async () => {
    render(<Controlled prompt="Select a project" options={[]} />);
    const select = screen.getByRole("button", { name: "Role Select a project" });
    await open(select);
    expect(options()).toEqual([]);
  });

  it("can't be opened while disabled", async () => {
    render(<Select label="Role" options={["viewer"]} value="viewer" disabled />);
    const select = screen.getByRole("button", { name: /Role/ }) as HTMLButtonElement;
    expect(select.disabled).toBe(true);
    await open(select);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("reports a blur when focus leaves, not when it moves into the open list", async () => {
    const onBlur = vi.fn();
    render(<Select label="Role" options={["viewer"]} value="viewer" onBlur={onBlur} />);
    const select = screen.getByRole("button", { name: /Role/ });
    select.focus();
    await key("ArrowDown");
    expect(document.activeElement).toBe(screen.getByRole("listbox"));
    expect(onBlur).not.toHaveBeenCalled();
    await key("Escape");
    act(() => select.blur());
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

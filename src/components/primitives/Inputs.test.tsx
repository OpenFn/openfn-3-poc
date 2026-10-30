import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { pickOption } from "../../test/select";
import { Checkbox, Field, Radio, Select, TextInput } from "./Inputs";
import RadioCards from "./RadioCards";

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

  it("says it's required in its name", () => {
    render(<Select label="Role" required options={["viewer"]} value="viewer" />);
    // jsdom drops the space before "(required)"; a browser keeps it.
    expect(screen.getByRole("button", { name: /^Role ?\(required\) viewer$/ })).toBeTruthy();
  });

  it("focuses the button when its label is clicked", () => {
    render(<Controlled initial="editor" />);
    fireEvent.click(screen.getByText("Role"));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Role Editor" }));
  });

  it("doesn't submit its form on Enter, before or after a mouse pick", async () => {
    const onSubmit = vi.fn((e: React.SubmitEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Controlled initial="viewer" />
        <button type="submit">Save</button>
      </form>
    );
    const select = screen.getByRole("button", { name: /^Role/ });
    select.focus();
    await key("Enter");
    fireEvent.pointerDown(select, { pointerType: "mouse", button: 0 });
    await pickOption(select, "Editor");
    select.focus();
    await key("Enter");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("leaves a button inside its label to itself, and doesn't click it when the label text is clicked", () => {
    const onMore = vi.fn();
    render(
      <Select
        label={
          <>
            Contact preference{" "}
            <button type="button" onClick={onMore}>
              More
            </button>
          </>
        }
        options={["any"]}
        value="any"
      />
    );
    fireEvent.click(screen.getByText("Contact preference"));
    expect(onMore).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /^Contact preference.* any$/ }));
    const more = screen.getByText("More");
    more.focus();
    fireEvent.click(more);
    expect(onMore).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(more);
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

  it("reports a blur when focus leaves from the open list", async () => {
    const onBlur = vi.fn();
    render(
      <>
        <Select label="Role" options={["viewer"]} value="viewer" onBlur={onBlur} />
        <input aria-label="Next field" />
      </>
    );
    screen.getByRole("button", { name: /Role/ }).focus();
    await key("ArrowDown");
    act(() => screen.getByLabelText("Next field").focus());
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});

/** The text of the elements an element's aria-describedby points at. */
const description = (el: Element) =>
  (el.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .join(" ");

describe("Field", () => {
  it("ties the control to its hint and errors, and marks it invalid", () => {
    render(<TextInput label="Name" hint="Lowercase only." errors={["can't be blank"]} />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(description(input)).toBe("Lowercase only. can't be blank");
  });

  it("fails a control with no label and no hidden name, and passes one in a labelled Field", () => {
    expect(() => render(<TextInput />)).toThrow("TextInput has no name");
    expect(() => render(<Select options={["a"]} value="a" />)).toThrow("Select has no name");
    render(
      <Field id="secret" label="Password">
        <TextInput id="secret" disabled />
      </Field>
    );
    expect(screen.getByRole("textbox", { name: "Password" })).toBeTruthy();
  });

  it("gives a control inside a labelled Field that Field's errors", () => {
    render(
      <Field id="secret" label="Password" errors={["can't be blank"]}>
        <TextInput id="secret" />
      </Field>
    );
    const input = screen.getByRole("textbox", { name: "Password" });
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(description(input)).toBe("can't be blank");
  });

  it("keeps an info tooltip out of the control's name", () => {
    render(<TextInput label="Adaptor" info="Choose an adaptor." />);
    expect(screen.getByRole("textbox", { name: "Adaptor" })).toBeTruthy();
  });

  it("makes a label with no control id plain text, not a label pointing at nothing", () => {
    render(
      <Field label="Adaptor">
        <button type="button">Change</button>
      </Field>
    );
    expect(document.querySelector("label")).toBeNull();
    expect(screen.getByText("Adaptor").tagName).toBe("SPAN");
  });

  it("gives a control inside a labelled Field that Field's id, so the label points at it without repeating the id", () => {
    render(
      <Field id="secret" label="Password">
        <TextInput />
      </Field>
    );
    expect(screen.getByRole("textbox", { name: "Password" }).id).toBe("secret");
  });

  it("reads a checkbox's hint as its description, not part of its name", () => {
    render(<Checkbox label="Allow console.log() usage" hint="Control what's printed in run logs" />);
    const box = screen.getByRole("checkbox", { name: "Allow console.log() usage" });
    expect(description(box)).toBe("Control what's printed in run logs");
  });

  it("leaves a control without errors unmarked", () => {
    render(<TextInput label="Name" hint="Lowercase only." />);
    expect(screen.getByRole("textbox", { name: "Name" }).hasAttribute("aria-invalid")).toBe(false);
  });

  it("marks only the control whose field has errors in a row", () => {
    render(
      <div>
        <TextInput aria-label="Email" errors={["has invalid format"]} />
        <Select aria-label="Role" options={["viewer"]} value="viewer" />
      </div>
    );
    expect(screen.getByRole("textbox", { name: "Email" }).getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("button", { name: /Role/ }).hasAttribute("aria-invalid")).toBe(false);
  });

  it("ties a Select to its errors", () => {
    render(<Select label="Role" options={["viewer"]} value="" errors={["can't be blank"]} />);
    const button = screen.getByRole("button", { name: /Role/ });
    expect(button.getAttribute("aria-invalid")).toBe("true");
    expect(description(button)).toBe("can't be blank");
  });

  it("ties a Select to errors that arrive after it mounts, and lets go when they clear", () => {
    const select = (errors: string[]) => <Select label="Role" options={["viewer"]} value="" errors={errors} />;
    const { rerender } = render(select([]));
    const button = screen.getByRole("button", { name: /Role/ });
    rerender(select(["can't be blank"]));
    expect(description(button)).toBe("can't be blank");
    rerender(select([]));
    expect(button.hasAttribute("aria-describedby")).toBe(false);
  });

  it("puts the star and an info tooltip after the label, keeping the name to the label", () => {
    render(<TextInput label="Environment name" required info="Names let a workflow pick values." />);
    expect((screen.getByRole("textbox", { name: /^Environment name\s*\*$/ }) as HTMLInputElement).required).toBe(true);
    screen.getByRole("button", { name: "Names let a workflow pick values." });
  });

  it("shows a badge beside the label without adding it to the control's name", () => {
    render(<TextInput label="Build with AI" aside={<span>Recommended</span>} />);
    screen.getByRole("textbox", { name: "Build with AI" });
    screen.getByText("Recommended");
  });

  it("as a group, names a fieldset with its label and disables every control in it", () => {
    render(
      <Field group label="Response" hint="When to reply." disabled>
        <Radio name="r" label="Immediately" />
        <Radio name="r" label="On completion" />
      </Field>
    );
    const group = screen.getByRole("group", { name: "Response" });
    expect(description(group)).toBe("When to reply.");
    for (const radio of screen.getAllByRole("radio")) expect(radio.matches(":disabled")).toBe(true);
  });

  it("gives a checkbox the error look through its field", () => {
    render(
      <Field errors={["must be accepted"]}>
        <Checkbox label="Make client global" />
      </Field>
    );
    const box = screen.getByRole("checkbox", { name: "Make client global" });
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(description(box)).toBe("must be accepted");
  });
});

describe("RadioCards", () => {
  it("is a named group of radios that reports the picked value", () => {
    const onChange = vi.fn();
    render(
      <RadioCards
        aria-label="Authentication type"
        value="basic"
        onChange={onChange}
        options={[
          { value: "basic", label: "Basic" },
          { value: "api", label: "API key" },
        ]}
      />
    );
    screen.getByRole("group", { name: "Authentication type" });
    expect((screen.getByRole("radio", { name: "Basic" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "API key" }));
    expect(onChange).toHaveBeenCalledWith("api");
  });
});

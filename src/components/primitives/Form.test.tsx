import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import Button from "./Button";
import Form from "./Form";
import { TextInput } from "./Inputs";

/** A form whose Save shows "can't be blank" on the field named `invalid`. */
function Probe({ invalid, serverError = false }: { invalid?: string; serverError?: boolean }) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const errorsFor = (name: string) => (submitted && name === invalid ? ["can't be blank"] : []);
  return (
    <Form
      pending={pending}
      onSubmit={(e) => {
        e.preventDefault();
        if (serverError) {
          setPending(true);
          setTimeout(() => {
            setSubmitted(true);
            setPending(false);
          });
        } else setSubmitted(true);
      }}
      actions={<Button type="submit">Save</Button>}
    >
      <TextInput label="Name" required errors={errorsFor("name")} />
      <TextInput label="Email" errors={errorsFor("email")} />
    </Form>
  );
}

describe("Form", () => {
  it("leaves required checks to the fields' own errors, not the browser's bubbles", () => {
    render(<Probe />);
    expect(screen.getByRole("button", { name: "Save" }).closest("form")?.noValidate).toBe(true);
  });

  it("moves focus to the first field with an error after a Save our checks refuse", () => {
    render(<Probe invalid="email" />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Email" }));
  });

  it("moves focus to the first field with an error when the server refuses", async () => {
    render(<Probe invalid="name" serverError />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^Name/ }));
  });

  it("leaves focus alone when Save starts saving, even with an old server error showing", () => {
    function Saving() {
      const [pending, setPending] = useState(false);
      return (
        <Form pending={pending} onSubmit={(e) => (e.preventDefault(), setPending(true))} actions={<Button type="submit">Save</Button>}>
          <TextInput label="Email" errors={["has already been taken"]} />
        </Form>
      );
    }
    render(<Saving />);
    const save = screen.getByRole("button", { name: "Save" });
    save.focus();
    fireEvent.click(save);
    expect(document.activeElement).not.toBe(screen.getByRole("textbox", { name: "Email" }));
  });

  it("doesn't take focus back when the user has moved on while it saved", async () => {
    render(<Probe invalid="name" serverError />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    screen.getByRole("textbox", { name: "Email" }).focus();
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Email" }));
  });

  it("shows its submit button as working while it saves, without the page passing it twice", () => {
    render(
      <Form pending onSubmit={() => {}} actions={<Button type="submit">Save</Button>}>
        <TextInput label="Name" />
      </Form>
    );
    expect(screen.getByRole("button", { name: /Save/ }).getAttribute("aria-busy")).toBe("true");
  });
});

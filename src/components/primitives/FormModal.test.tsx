import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormModal from "./FormModal";
import { TextInput } from "./Inputs";
import { useForm } from "../../utils/useForm";

/** An "Add collaborator" modal whose email can't be blank. */
function AddModal() {
  const form = useForm({ initial: { email: "" }, validate: ({ email }) => ({ email: email ? [] : ["can't be blank"] }) });
  return (
    <FormModal open title="Add collaborator" formId="add-form" onClose={() => {}} submitLabel="Add" onSubmit={form.modalSubmit(() => {})}>
      <TextInput label="Name" />
      <TextInput label="Email" required {...form.fieldProps("email")} />
    </FormModal>
  );
}

describe("FormModal", () => {
  it("leaves required checks to the fields' own errors, not the browser's bubbles", () => {
    render(<AddModal />);
    expect((document.getElementById("add-form") as HTMLFormElement).noValidate).toBe(true);
  });

  /** The modal takes focus as it opens; wait for that, as a user would. */
  const opened = () => waitFor(() => expect(document.activeElement).not.toBe(document.body));

  it("moves focus to the first field with an error after a refused Save", async () => {
    render(<AddModal />);
    await opened();
    const add = screen.getByRole("button", { name: "Add" });
    add.focus();
    fireEvent.click(add);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^Email/ })));
  });

  it("does the same when Enter in another field submits", async () => {
    render(<AddModal />);
    await opened();
    const name = screen.getByRole<HTMLInputElement>("textbox", { name: "Name" });
    name.focus();
    fireEvent.submit(name.form!);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: /^Email/ })));
  });
});

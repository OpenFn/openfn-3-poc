import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { isDisabled } from "@/test/disabled";
import type { AdminUserRow } from "@/types/admin";
import UserFormModal from "./UserFormModal";

const alan: AdminUserRow = { id: "u3", firstName: "Alan", lastName: "Turing", email: "alan@example.com", role: "user", supportUser: false, disabled: false };
const ready = { state: "ready" } as const;

function renderModal(props: Partial<ComponentProps<typeof UserFormModal>> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const all = { profileHref: "/profile", onCancel: () => {}, onSave, ...props };
  const { rerender } = render(<UserFormModal {...all} />);
  return { onSave, rerender: (next: Partial<ComponentProps<typeof UserFormModal>>) => rerender(<UserFormModal {...all} {...next} />) };
}

const dialog = () => within(screen.getByRole("dialog"));
// Required fields have a star after their label.
const field = (label: string) => dialog().getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;
const type = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
const press = (name: string) => fireEvent.click(dialog().getByRole("button", { name }));

describe("UserFormModal", () => {
  it("keeps Create user pressable on a blank form, and pressing it says each field is blank without saving", async () => {
    const { onSave } = renderModal();
    expect(screen.getByRole("heading", { name: "New user" })).toBeTruthy();
    expect(dialog().getByText("They can change it once they've logged in.")).toBeTruthy();
    expect(dialog().queryByRole("checkbox", { name: "Disabled" })).toBeNull();
    press("Create user");
    expect(await dialog().findAllByText("can't be blank")).toHaveLength(4);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("starts from the account once it loads, and sends a password only when one is typed", async () => {
    const { onSave, rerender } = renderModal({ editing: { id: "u3", status: { state: "loading" }, user: undefined, ownAccount: false } });
    expect(isDisabled(dialog().getByRole("button", { name: "Save" }))).toBe(true);
    rerender({ editing: { id: "u3", status: ready, user: alan, ownAccount: false } });
    expect(screen.getByRole("heading", { name: "Edit Alan Turing" })).toBeTruthy();
    expect(field("Email").value).toBe("alan@example.com");
    expect(dialog().getByText("Leave blank to keep their current password.")).toBeTruthy();

    press("Save");
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenLastCalledWith({ first_name: "Alan", last_name: "Turing", email: "alan@example.com", role: "user", support_user: false, disabled: false });

    type("Password", "a long enough password");
    press("Save");
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ password: "a long enough password" }));
  });

  it("warns how far support access reaches whenever Support user is ticked, including on opening", () => {
    renderModal({ editing: { id: "u3", status: ready, user: { ...alan, supportUser: true }, ownAccount: false } });
    const warning = "This user will be able to open every project that has support access turned on.";
    expect(dialog().getByText(warning)).toBeTruthy();
    fireEvent.click(dialog().getByRole("checkbox", { name: "Support user" }));
    expect(dialog().queryByText(warning)).toBeNull();
  });

  it("on your own account, greys role, support access, disabled and email with why, has no password, and saves only the names", async () => {
    const { onSave } = renderModal({ editing: { id: "u3", status: ready, user: alan, ownAccount: true } });
    expect(dialog().queryByLabelText("Password")).toBeNull();
    const reasons: [HTMLElement, string][] = [
      [dialog().getByRole("button", { name: /^Role/ }), "You can't change your own role."],
      [dialog().getByRole("checkbox", { name: "Support user" }), "You can't change your own support access."],
      [dialog().getByRole("checkbox", { name: "Disabled" }), "You can't disable your own account."],
      [field("Email"), "Change your own email and password in your profile."],
    ];
    for (const [control, reason] of reasons) {
      expect(isDisabled(control)).toBe(true);
      expect(control.getAttribute("aria-describedby")?.split(" ").some((id) => document.getElementById(id)?.textContent === reason)).toBe(true);
    }
    expect(dialog().getByRole("link", { name: "your profile" }).getAttribute("href")).toBe("/profile");

    type("First name", "Alana");
    press("Save");
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ first_name: "Alana", last_name: "Turing" }));
  });
});

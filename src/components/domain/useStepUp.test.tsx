import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "../primitives/Button";
import { useStepUp, type StepUpOptions } from "./useStepUp";

const stepUpRequired = new Error("You must confirm access to do this.");

/** A button that runs the guarded action and records how it settled. */
function Harness({ action, stepUp, onSettled }: { action: () => Promise<string>; stepUp: StepUpOptions["stepUp"]; onSettled: (outcome: unknown) => void }) {
  const [guarded, dialog] = useStepUp(action, { isStepUpRequired: (e) => e === stepUpRequired, stepUp, hasMfa: true });
  return (
    <>
      <Button onClick={() => void guarded().then(onSettled, onSettled)}>Generate</Button>
      {dialog}
    </>
  );
}

function setup(stepUp: StepUpOptions["stepUp"] = vi.fn().mockResolvedValue(undefined)) {
  const action = vi.fn().mockRejectedValueOnce(stepUpRequired).mockResolvedValue("new-token");
  const onSettled = vi.fn();
  render(<Harness action={action} stepUp={stepUp} onSettled={onSettled} />);
  fireEvent.click(screen.getByRole("button", { name: "Generate" }));
  return { action, onSettled, stepUp };
}

const typePassword = async (password: string) => {
  fireEvent.change(await screen.findByLabelText(/Password/), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
};

describe("useStepUp", () => {
  it("asks for the password when the action is refused, steps up, then runs the action again", async () => {
    const { action, onSettled, stepUp } = setup();
    await typePassword("secret");
    await waitFor(() => expect(onSettled).toHaveBeenCalledWith("new-token"));
    expect(stepUp).toHaveBeenCalledWith({ password: "secret" });
    expect(action).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("steps up with an authenticator code", async () => {
    const { stepUp } = setup();
    fireEvent.click(await screen.findByText("Use your authenticator app instead"));
    fireEvent.change(screen.getByLabelText(/Authentication Code/), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));
    await waitFor(() => expect(stepUp).toHaveBeenCalledWith({ mfaCode: "123456" }));
  });

  it("on Cancel, closes and rejects with the original refusal without running the action again", async () => {
    const { action, onSettled } = setup();
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onSettled).toHaveBeenCalledWith(stepUpRequired));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the dialog open on a wrong password, with the server's words on the field and the password still typed", async () => {
    const { action, onSettled } = setup(vi.fn().mockRejectedValue(new Error("Invalid password! Try again.")));
    await typePassword("wrong");
    expect(await screen.findByText("Invalid password! Try again.")).toBeTruthy();
    expect((screen.getByLabelText(/Password/) as HTMLInputElement).value).toBe("wrong");
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(action).toHaveBeenCalledTimes(1);
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("passes any other refusal straight through", async () => {
    const other = new Error("Not allowed");
    const onSettled = vi.fn();
    render(<Harness action={() => Promise.reject(other)} stepUp={vi.fn()} onSettled={onSettled} />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => expect(onSettled).toHaveBeenCalledWith(other));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

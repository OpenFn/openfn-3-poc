import type { Meta, StoryObj } from "@storybook/react";
import { useRef, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";
import Button from "../primitives/Button";
import Text from "../primitives/Text";
import { useAction } from "../../utils/useAction";
import StepUpDialog from "./StepUpDialog";
import { useStepUp } from "./useStepUp";

const meta: Meta<typeof StepUpDialog> = {
  title: "Domain/StepUpDialog",
  component: StepUpDialog,
  args: { open: true, hasMfa: true, onSubmit: async () => {}, onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof StepUpDialog>;

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

export const Password: Story = {};
export const WithoutMfa: Story = { args: { hasMfa: false } };
export const AuthenticatorCode: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(page(canvasElement).getByText("Use your authenticator app instead"));
  },
};
/** The server's words show on the field, and the password stays typed. */
export const WrongPassword: Story = {
  args: { onSubmit: () => Promise.reject(new Error("Invalid password! Try again.")) },
  play: async ({ canvasElement }) => {
    const body = page(canvasElement);
    await userEvent.type(body.getByLabelText(/Password/), "not-my-password");
    await userEvent.click(body.getByRole("button", { name: "Confirm" }));
    await body.findByText("Invalid password! Try again.");
  },
};
export const Pending: Story = {
  args: { onSubmit: () => new Promise(() => {}) },
  play: async ({ canvasElement }) => {
    const body = page(canvasElement);
    await userEvent.type(body.getByLabelText(/Password/), "my-password");
    await userEvent.click(body.getByRole("button", { name: "Confirm" }));
  },
};

const stepUpRequired = new Error("You must confirm access to do this.");

/** A page whose Generate button is refused until the person steps up; the password is "password". */
function GenerateTokenDemo() {
  // The fake server remembers the step-up, outside React, as a real one would.
  const steppedUp = useRef(false);
  const [token, setToken] = useState<string | null>(null);
  const [generate, stepUpDialog] = useStepUp(
    async () => {
      if (!steppedUp.current) throw stepUpRequired;
      return "demo.fake-token-not-real.QrStU-24680";
    },
    {
      hasMfa: true,
      isStepUpRequired: (error) => error === stepUpRequired,
      stepUp: async (credentials) => {
        if (!("password" in credentials) || credentials.password !== "password") throw new Error("Invalid password! Try again.");
        steppedUp.current = true;
      },
    }
  );
  const action = useAction(generate, { onSuccess: setToken, onError: "toast" });
  return (
    <>
      <Button pending={action.pending} onClick={() => void action.run()}>
        Generate New Token
      </Button>
      {token && <Text as="p">{token}</Text>}
      {stepUpDialog}
    </>
  );
}

/** A refused action opens the dialog; after stepping up, the action runs again and succeeds. */
export const RetriesAfterSteppingUp: StoryObj = {
  render: () => <GenerateTokenDemo />,
  play: async ({ canvasElement }) => {
    const body = page(canvasElement);
    const generate = body.getByRole("button", { name: "Generate New Token" });
    await userEvent.click(generate);
    const password = await body.findByLabelText(/Password/);
    await waitFor(() => expect(password).toHaveFocus());
    await userEvent.type(password, "password");
    await userEvent.click(body.getByRole("button", { name: "Confirm" }));
    await body.findByText("demo.fake-token-not-real.QrStU-24680");
    await waitFor(() => expect(body.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(generate).toHaveFocus());
  },
};

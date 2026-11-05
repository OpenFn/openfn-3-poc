import { useState } from "react";
import FormModal from "@/components/primitives/FormModal";
import { errorMessage, RequestError } from "@/utils/errors";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import ConfirmAccessField, { ConfirmAccessSwitch, type ConfirmAccessMethod } from "./ConfirmAccessField";

/** What the person steps up with: one or the other, as `POST /api/session` takes them. */
export type StepUpCredentials = { password: string } | { mfaCode: string };

interface Props {
  open: boolean;
  /** Whether the person has an authenticator, so the code is offered as well as the password. */
  hasMfa: boolean;
  /** Steps up. A rejection's message shows on the field, and what was typed stays. */
  onSubmit: (credentials: StepUpCredentials) => Promise<void>;
  onClose: () => void;
  /** What confirming is for, said under the title (e.g. "Confirm it's you to delete your account."). */
  description?: string | undefined;
}

/**
 * Lightning's Confirm access form as a pop-up, for any action the server
 * refuses until the person has entered their password or a code in the last
 * five minutes. Mount it only while open; `useStepUp` does.
 */
export default function StepUpDialog({ open, hasMfa, onSubmit, onClose, description }: Props) {
  const [method, setMethod] = useState<ConfirmAccessMethod>("password");
  const form = useForm({ initial: { value: "" }, validate: ({ value }) => ({ value: blank(value) }) });

  const submit = form.modalSubmit(async ({ value }) => {
    try {
      await onSubmit(method === "password" ? { password: value } : { mfaCode: value });
    } catch (e) {
      // A refused password or code belongs to the box it was typed in.
      const message = errorMessage(e);
      throw new RequestError(message, { fieldErrors: { value: [message] } });
    }
  });

  const switchTo = (next: ConfirmAccessMethod) => {
    setMethod(next);
    form.reset();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Confirm access"
      description={description}
      size="sm"
      formId="reauthentication-form"
      onSubmit={submit}
      submitLabel={method === "password" ? "Confirm" : "Verify"}
    >
      <ConfirmAccessField method={method} data-autofocus {...form.fieldProps("value")} />
      {(hasMfa || method === "totp") && <ConfirmAccessSwitch method={method} onSwitch={switchTo} />}
    </FormModal>
  );
}

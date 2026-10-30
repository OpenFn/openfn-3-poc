import { useState, type ReactNode } from "react";
import Alert from "../primitives/Alert";
import Button from "../primitives/Button";
import CopyButton from "../primitives/CopyButton";
import { Field, TextInput } from "../primitives/Inputs";
import FormModal from "../primitives/FormModal";
import Modal from "../primitives/Modal";
import Text from "../primitives/Text";
import type { ReauthValues, WebhookAuthMethodRow, WebhookAuthMethodValues, WebhookAuthType } from "../../types/project-settings";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";
import { useAction } from "../../utils/useAction";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";

interface Props {
  /** Omit to create a new method (starts at the "choose a type" step). */
  authMethod?: WebhookAuthMethodRow | undefined;
  onCancel: () => void;
  /** Creates the method, or renames an existing one. Rejects with field errors (`name`) or a message, which keep the modal open. */
  onSave: (values: WebhookAuthMethodValues) => Promise<void>;
  /** A new API key from the host, shown before the method is created. The host keeps it; `onSave` doesn't send it back. */
  onGenerateApiKey: () => Promise<string>;
  /** An existing method's password or API key, once the user has re-authenticated. Rejects when the password or code is wrong. */
  onReveal?: ((values: ReauthValues) => Promise<string>) | undefined;
}

/** A secret with a Show / Copy button (maybe_mask_password_field / maybe_mask_api_key_field). */
function SecretField({ id, value, type, revealed, onShow }: { id: string; value: string; type: "password" | "text"; revealed: boolean; onShow: () => void }) {
  const buttonId = `${id}_action_button`;
  const buttonClass = "-ml-px w-24 rounded-l-none rounded-r-lg";
  return (
    <div className="flex">
      <TextInput id={id} type={type} value={value} disabled fieldClassName="flex-1" className="rounded-r-none" />
      {revealed ? (
        <CopyButton id={buttonId} value={value} className={buttonClass}>
          Copy
        </CopyButton>
      ) : (
        <Button id={buttonId} variant="secondary" className={buttonClass} onClick={onShow}>
          Show
        </Button>
      )}
    </div>
  );
}

function TypeOption({ selected, icon, children, onSelect }: { selected: boolean; icon: string; children: ReactNode; onSelect: () => void }) {
  return (
    <label
      className={cn(
        // eslint-disable-next-line no-restricted-syntax -- a control: the auth type card owns its type
        "flex cursor-pointer items-center gap-x-2.5 rounded-lg border border-subtle bg-surface p-2 text-sm shadow-xs",
        selected && "outline-2 outline-offset-2 outline-focus"
      )}
    >
      {/* eslint-disable-next-line no-restricted-syntax -- visually hidden radio; the card around it is the control */}
      <input type="radio" name="auth_type" className="sr-only" checked={selected} onChange={onSelect} />
      <span className={cn(icon, "h-10 w-10")} />
      {children}
    </label>
  );
}

/**
 * WebhookAuthMethodFormComponent (workflow_live/webhook_auth_method_form_component.ex):
 * pick Basic or API key, then name it. The host generates a new method's API
 * key. An existing method's secret arrives masked; "Show" asks the user to
 * re-authenticate, and the host answers with the secret.
 */
export default function WebhookAuthMethodFormModal({ authMethod, onCancel, onSave, onGenerateApiKey, onReveal }: Props) {
  const isNew = !authMethod;
  const [choice, setChoice] = useState<WebhookAuthType | null>(authMethod?.authType ?? null);
  const [authType, setAuthType] = useState<WebhookAuthType | null>(authMethod?.authType ?? null);
  const [apiKey, setApiKey] = useState("");
  const [reauth, setReauth] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [reauthValues, setReauthValues] = useState<ReauthValues>({ password: "", code: "" });
  const form = useForm({
    initial: { name: authMethod?.name ?? "", username: authMethod?.username ?? "", password: "" },
    validate: ({ name, username, password }) => ({
      name: blank(name),
      ...(isNew && authType === "basic" ? { username: blank(username), password: blank(password) } : {}),
    }),
  });
  const next = useAction(async () => {
    if (choice === "api") setApiKey(await onGenerateApiKey());
    setAuthType(choice);
  });
  const reveal = useAction(async () => {
    if (!onReveal) return;
    setSecret(await onReveal(reauthValues));
    setReauth(false);
  });

  const title = isNew
    ? authType === null
      ? "Add an authentication method"
      : authType === "basic"
        ? 'Create a "basic auth" method'
        : 'Create an "API token" method'
    : "Webhook Authentication Method";

  if (reauth) {
    return (
      <Modal
        open
        onClose={onCancel}
        title={title}
        footer={
          <>
            <Button type="submit" form="reauthentication-form" pending={reveal.pending}>
              Done
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setReauth(false);
                setReauthValues({ password: "", code: "" });
                reveal.reset();
              }}
            >
              Back
            </Button>
          </>
        }
      >
        <form
          id="reauthentication-form"
          onSubmit={(e) => {
            e.preventDefault();
            void reveal.run();
          }}
        >
          <Text as="div" className="space-y-4">
            <p>
              You're required to reauthenticate yourself before viewing the webhook{" "}
              {authType === "basic" ? "Password" : "API Key"}
            </p>
            {reveal.error && <Alert tone="danger">{errorMessage(reveal.error)}</Alert>}
            <TextInput
              id="user_password"
              type="password"
              label="Password"
              autoComplete="new-password"
              value={reauthValues.password}
              onChange={(e) => setReauthValues({ ...reauthValues, password: e.target.value })}
            />
            <div className="flex items-center gap-2 text-muted">
              <hr className="flex-1 border-strong" />
              OR
              <hr className="flex-1 border-strong" />
            </div>
            <TextInput
              id="user_code"
              label="2FA Code"
              inputMode="numeric"
              value={reauthValues.code}
              onChange={(e) => setReauthValues({ ...reauthValues, code: e.target.value })}
            />
          </Text>
        </form>
      </Modal>
    );
  }

  if (authType === null) {
    return (
      <Modal
        open
        onClose={onCancel}
        title={title}
        footer={
          <Button disabled={choice === null} pending={next.pending} onClick={() => void next.run()}>
            Next
          </Button>
        }
      >
        <div className="space-y-4">
          {next.error && <Alert tone="danger">{errorMessage(next.error)}</Alert>}
          <TypeOption selected={choice === "basic"} icon="hero-globe-alt" onSelect={() => setChoice("basic")}>
            Basic HTTP Authentication (username &amp; password)
          </TypeOption>
          <TypeOption selected={choice === "api"} icon="hero-code-bracket-square" onSelect={() => setChoice("api")}>
            API Key Authentication (‘x-api-key’ header)
          </TypeOption>
        </div>
      </Modal>
    );
  }

  const save = ({ name, username, password }: { name: string; username: string; password: string }) =>
    onSave(authType === "basic" ? { authType, name, username, password } : { authType, name });

  return (
    <FormModal
      open
      onClose={onCancel}
      title={title}
      formId="webhook-auth-method-form"
      formClassName="space-y-4"
      onSubmit={form.modalSubmit(save)}
      submitLabel={isNew ? "Create auth method" : "Save changes"}
    >
      <TextInput id="webhook_auth_method_name" label="Auth method name" required {...form.fieldProps("name")} />
      {authType === "basic" ? (
        <>
          <TextInput
            id="webhook_auth_method_username"
            label="Username"
            required
            disabled={!isNew}
            {...form.fieldProps("username")}
          />
          {isNew ? (
            <TextInput
              id="webhook_auth_method_password"
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              {...form.fieldProps("password")}
            />
          ) : (
            <Field id="webhook_auth_method_password" label="Password">
              <SecretField
                id="webhook_auth_method_password"
                type="password"
                value={secret ?? authMethod.maskedSecret}
                revealed={secret !== null}
                onShow={() => setReauth(true)}
              />
            </Field>
          )}
        </>
      ) : (
        <Field id="webhook_auth_method_api_key" label="API Key">
          <SecretField
            id="webhook_auth_method_api_key"
            type="text"
            value={isNew ? apiKey : (secret ?? authMethod.maskedSecret)}
            revealed={isNew || secret !== null}
            onShow={() => setReauth(true)}
          />
        </Field>
      )}
    </FormModal>
  );
}

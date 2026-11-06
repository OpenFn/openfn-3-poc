import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/primitives/Button";
import Card from "@/components/primitives/Card";
import ConfirmModal from "@/components/primitives/ConfirmModal";
import CopyButton from "@/components/primitives/CopyButton";
import Form from "@/components/primitives/Form";
import { Field, PasswordInput, TextInput } from "@/components/primitives/Inputs";
import { Row, Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import type { AuthProvider, AuthProviderValues } from "@/types/admin";
import { authRedirectUri } from "@/utils/urls";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";

interface Props {
  /** The provider set up now, or null: then the form sets one up. The fields start from it when the form mounts. */
  provider: AuthProvider | null;
  /** The instance's own base URL, which the redirect URI starts with. */
  instanceUrl: string;
  /** Saves. Resolves once the host has it; rejects with field errors or a message, which stay in the form. */
  onSave: (values: AuthProviderValues) => Promise<void>;
  /** Removes the provider, once confirmed. Rejects with a message, which stays in the dialog. */
  onRemove: () => Promise<void>;
}

/**
 * The instance's OpenID Connect provider (auth_providers/form_component.ex).
 * The server checks the name's format and the discovery document; here only
 * blanks are checked.
 */
export default function AuthProviderForm({ provider, instanceUrl, onSave, onRemove }: Props) {
  const nameId = useId();
  const [removing, setRemoving] = useState(false);
  const form = useForm<AuthProviderValues>({
    initial: { name: provider?.name ?? "", discovery_url: provider?.discoveryUrl ?? "", client_id: provider?.clientId ?? "", client_secret: "" },
    validate: (v) => ({
      name: blank(v.name),
      discovery_url: blank(v.discovery_url),
      client_id: blank(v.client_id),
      client_secret: provider ? [] : blank(v.client_secret),
    }),
  });
  const save = async (values: AuthProviderValues) => {
    await onSave(values);
    // The server holds the secret now; the box goes back to "stored".
    form.reset({ ...values, client_secret: "" });
  };
  const removedHere = useRef(false);
  const remove = async () => {
    removedHere.current = true;
    await onRemove();
    form.reset({ name: "", discovery_url: "", client_id: "", client_secret: "" });
    setRemoving(false);
  };
  // Removing takes the Remove button away with its card: focus starts the blank form again.
  useEffect(() => {
    if (provider || !removedHere.current) return;
    removedHere.current = false;
    document.getElementById(nameId)?.focus();
  }, [provider, nameId]);
  const redirectUri = authRedirectUri(instanceUrl, form.values.name);

  return (
    <Stack gap="lg">
      <Card padding="lg">
        <Form {...form.formProps(save)} actions={<Button type="submit">Save</Button>}>
          <TextInput id={nameId} label="Name" required hint="Lower case, used in the redirect URI, e.g. sim-dtu-sso." {...form.fieldProps("name")} />
          <TextInput
            label="Discovery URL"
            required
            type="url"
            hint="The provider's .well-known/openid-configuration URL, which lists every endpoint OpenFn needs."
            {...form.fieldProps("discovery_url")}
          />
          <TextInput label="Client ID" required {...form.fieldProps("client_id")} />
          <PasswordInput
            label="Client secret"
            required={!provider}
            autoComplete="new-password"
            placeholder={provider ? "Stored; type to replace it" : undefined}
            hint={provider ? "Leave blank to keep the secret that's stored." : undefined}
            {...form.fieldProps("client_secret")}
          />
          <Field label="Redirect URI" hint="Add this redirect URI to the client in your provider.">
            <Row gap="md" justify="between">
              <Text variant="code-md" className="min-w-0 wrap-break-word">
                {redirectUri}
              </Text>
              <CopyButton value={redirectUri} className="shrink-0">
                Copy redirect URI
              </CopyButton>
            </Row>
          </Field>
        </Form>
      </Card>
      {provider && (
        <>
          <Card
            padding="lg"
            title="Remove provider"
            description="Deletes this configuration and turns off single sign-on for everyone on this instance. People can still log in with their password."
            action={
              <Button tone="danger" onClick={() => setRemoving(true)}>
                Remove
              </Button>
            }
          />
          {removing && (
            <ConfirmModal
              open
              onClose={() => {
                removedHere.current = false;
                setRemoving(false);
              }}
              title="Remove authentication provider"
              tone="danger"
              confirmLabel="Remove provider"
              onConfirm={remove}
            >
              <p>
                Single sign-on through {provider.name} stops straight away. Anyone who only logs in that way will need a
                password reset.
              </p>
            </ConfirmModal>
          )}
        </>
      )}
    </Stack>
  );
}

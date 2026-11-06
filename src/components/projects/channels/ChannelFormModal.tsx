import { useState } from "react";
import type { ChannelFormValues, ChannelRow } from "@/types/channels";
import type { ResourceStatus } from "@/types/resource";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import FormModal from "@/components/primitives/FormModal";
import { Checkbox, Field, Select, TextInput } from "@/components/primitives/Inputs";
import Text from "@/components/primitives/Text";
import TextLink from "@/components/primitives/TextLink";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import ProxyUrlCopy from "./ProxyUrlCopy";

interface Props {
  /** The channel being edited; left out for a new one. */
  channel?: ChannelRow | undefined;
  /** The project's credentials (Destination credential), as [name, id]. */
  credentialOptions: [label: string, value: string][];
  /** The project's webhook auth methods (Client credentials), as [name, id]. */
  authMethodOptions: [label: string, value: string][];
  /** Where loading the options stands; until they are ready the modal shows that in place of the form. Left out, they are ready. */
  status?: ResourceStatus | undefined;
  /** Project settings' credentials, opened in a new tab by "Add new". */
  credentialsSettingsHref: string;
  /** Project settings' webhook security, opened in a new tab by "Add new". */
  webhookSecuritySettingsHref: string;
  /** Closes the form without saving. */
  onCancel: () => void;
  /**
   * Saves the channel, handing back the one the form opened with, so an edit
   * carries the version it started from. Rejects with field errors keyed as the
   * API keys them (`name`, `destination_url`), or a message; either keeps the modal open.
   */
  onSave: (values: ChannelFormValues, opened: ChannelRow | undefined) => Promise<void>;
}

/**
 * New / Edit channel (ChannelLive.FormComponent): the proxy URL when editing,
 * then Name, Destination URL, Destination credential, Client credentials and
 * Enabled, which waits for Save. The client checks only for blanks; the
 * server checks the rest.
 */
export default function ChannelFormModal({
  channel: listed,
  credentialOptions,
  authMethodOptions,
  status = { state: "ready" },
  credentialsSettingsHref,
  webhookSecuritySettingsHref,
  onCancel,
  onSave,
}: Props) {
  // A reload while the form is open brings a newer version; saving over it would hide someone else's change.
  const [channel] = useState(listed);
  const form = useForm<ChannelFormValues>({
    initial: {
      name: channel?.name ?? "",
      destination_url: channel?.destinationUrl ?? "",
      enabled: channel?.enabled ?? true,
      destination_credential_id: channel?.destinationCredentialId ?? null,
      client_auth_method_ids: channel?.clientAuthMethodIds ?? [],
    },
    validate: ({ name, destination_url }) => ({ name: blank(name), destination_url: blank(destination_url) }),
  });
  const clients = form.values.client_auth_method_ids;
  const setClient = (id: string, on: boolean) => form.set("client_auth_method_ids", on ? [...clients, id] : clients.filter((x) => x !== id));

  return (
    <FormModal
      open
      onClose={onCancel}
      size="md"
      title={channel ? `Edit ${channel.name}` : "New channel"}
      formId={`channel-form-${channel?.id ?? "new"}`}
      onSubmit={form.modalSubmit((values) => onSave(values, channel))}
      submitLabel={channel ? "Save" : "Create channel"}
      errorHeader="The channel wasn't saved"
      submitDisabled={status.state !== "ready"}
    >
      <AsyncBoundary status={status}>
        {channel && (
          <Field label="Proxy URL">
            <ProxyUrlCopy url={channel.proxyUrl} />
          </Field>
        )}
        <TextInput id="channel_name" label="Name" placeholder="dhis2-send-events" {...form.fieldProps("name")} />
        <TextInput
          id="channel_destination_url"
          label="Destination URL"
          hint="The service OpenFn forwards requests to."
          placeholder="https://"
          {...form.fieldProps("destination_url")}
        />
        <Select
          id="channel_destination_credential"
          label="Destination credential"
          hint="How OpenFn signs in to the destination."
          aside={<AddNew href={credentialsSettingsHref} />}
          options={[["None", ""], ...credentialOptions]}
          value={form.values.destination_credential_id ?? ""}
          errors={form.errors.destination_credential_id}
          onChange={(e) => form.set("destination_credential_id", e.target.value || null)}
        />
        <Field
          group
          label="Client credentials"
          hint="Credentials that you can use to access this channel"
          aside={<AddNew href={webhookSecuritySettingsHref} />}
          errors={form.errors.client_auth_method_ids}
          // Announced as it appears, when the last one is unticked.
          note={<span aria-live="polite">{clients.length === 0 && "With none, anyone who has the proxy URL can use this channel."}</span>}
        >
          {authMethodOptions.length === 0 ? (
            <Text tone="muted">No webhook auth methods available.</Text>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {authMethodOptions.map(([name, id]) => (
                <Checkbox
                  key={id}
                  id={`client_auth_${id}`}
                  label={name}
                  checked={clients.includes(id)}
                  onChange={(e) => setClient(id, e.target.checked)}
                />
              ))}
            </div>
          )}
        </Field>
        <Checkbox checked={form.values.enabled} onChange={(e) => form.set("enabled", e.target.checked)} label="Enabled" />
      </AsyncBoundary>
    </FormModal>
  );
}

/** A field's "Add new" link, opening project settings in a new tab as Lightning does. */
function AddNew({ href }: { href: string }) {
  return (
    <TextLink to={href} target="_blank">
      Add new
    </TextLink>
  );
}

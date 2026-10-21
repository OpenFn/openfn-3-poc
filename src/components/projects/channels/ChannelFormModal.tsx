import type { ChannelForm, ChannelFormValues } from "../../../types/channels";
import FormModal from "../../FormModal";
import { Checkbox, Field, Select, TextInput } from "../../Inputs";
import Toggle from "../../Toggle";
import TextLink from "../../TextLink";
import { useForm } from "../../../utils/useForm";
import { blank } from "../../../utils/validate";
import ProxyUrlCopy from "./ProxyUrlCopy";

/**
 * New / Edit Channel (ChannelLive.FormComponent): the proxy URL when editing,
 * then Name, Enabled, Destination URL, Destination Credential and Client
 * Credentials. Save calls `onSave`; a rejection with field errors (`name`,
 * `destinationUrl`) shows them on the fields, any other keeps the form open
 * with the message. The host announces success.
 */
export default function ChannelFormModal({
  form,
  settingsHref,
  onClose,
  onSave,
}: {
  form: ChannelForm;
  /** The project settings page; "Add New" opens its credentials and webhook security tabs. */
  settingsHref: string;
  onClose: () => void;
  onSave: (values: ChannelFormValues) => Promise<void>;
}) {
  const { channel, credentialOptions, authMethodOptions } = form;
  const f = useForm<ChannelFormValues>({
    initial: {
      name: channel?.name ?? "",
      enabled: channel?.enabled ?? true,
      destinationUrl: channel?.destinationUrl ?? "",
      destinationCredentialId: channel?.destinationCredentialId ?? "",
      clientAuthMethodIds: channel?.clientAuthMethodIds ?? [],
    },
    validate: ({ name, destinationUrl }) => ({ name: blank(name), destinationUrl: blank(destinationUrl) }),
  });
  const clients = f.values.clientAuthMethodIds;
  const setClient = (id: string, on: boolean) =>
    f.set("clientAuthMethodIds", on ? [...clients, id] : clients.filter((x) => x !== id));

  return (
    <FormModal
      open
      onClose={onClose}
      size="md"
      title={channel ? "Edit Channel" : "New Channel"}
      formId={`channel-form-${channel?.id ?? "new"}`}
      onSubmit={f.modalSubmit(async (values) => {
        await onSave(values);
        onClose();
      })}
      submitLabel="Save"
    >
      {channel && (
        <Field label="Proxy URL">
          <ProxyUrlCopy url={channel.proxyUrl} />
        </Field>
      )}
      <TextInput id="channel_name" label="Name" {...f.fieldProps("name")} />
      <Toggle checked={f.values.enabled} onChange={(v) => f.set("enabled", v)} label="Enabled" />
      <TextInput
        id="channel_destination_url"
        label="Destination URL"
        hint="The service OpenFn will forward requests to"
        placeholder="https://"
        {...f.fieldProps("destinationUrl")}
      />
      <Select
        id="channel_destination_credential"
        label={<LabelWithLink href={`${settingsHref}#credentials`}>Destination Credential</LabelWithLink>}
        hint="How OpenFn authenticates with the destination service"
        options={[["None", ""], ...credentialOptions.map((pc): [string, string] => [pc.name, pc.id])]}
        {...f.fieldProps("destinationCredentialId")}
      />
      <Field
        label={<LabelWithLink href={`${settingsHref}#webhook_security`}>Client Credentials</LabelWithLink>}
        hint="Credentials that you can use to access this channel"
      >
        {authMethodOptions.length === 0 ? (
          <p className="italic text-xs text-gray-400">No webhook auth methods available.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {authMethodOptions.map((wam) => (
              <Checkbox
                key={wam.id}
                id={`client_auth_${wam.id}`}
                label={wam.name}
                checked={clients.includes(wam.id)}
                onChange={(e) => setClient(wam.id, e.target.checked)}
              />
            ))}
          </div>
        )}
      </Field>
    </FormModal>
  );
}

/** A field label with an "Add New" link beside it, opening settings in a new tab as Lightning does. */
function LabelWithLink({ href, children }: { href: string; children: string }) {
  return (
    <span className="flex items-baseline gap-2">
      {children}
      <TextLink href={href} target="_blank" className="text-xs font-normal">
        Add New
      </TextLink>
    </span>
  );
}

import FormModal from "../primitives/FormModal";
import { Select, TextInput } from "../primitives/Inputs";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";
import type { CredentialRef, KeychainCredentialRow, KeychainCredentialValues } from "../../types/credentials";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Set to edit an existing keychain credential. */
  keychainCredential?: KeychainCredentialRow | undefined;
  /** The project's credentials, offered as the default. */
  credentials: CredentialRef[];
  /** Saves the form. Rejects with field errors or a message, and the modal stays open; closes once it resolves. */
  onSave: (values: KeychainCredentialValues) => Promise<void>;
}

/**
 * Lightning's `keychain_credential_form` (live/components/credentials.ex):
 * a name, a JSONPath that selects the credential at run time, and a default.
 */
export default function KeychainCredentialFormModal({ open, onClose, keychainCredential: kc, credentials, onSave }: Props) {
  const form = useForm({
    initial: { name: kc?.name ?? "", path: kc?.path ?? "", defaultCredentialId: kc?.defaultCredential?.id ?? "" },
    validate: (v) => ({ name: blank(v.name), path: blank(v.path) }),
  });

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={kc ? `Edit ${kc.name || "keychain credential"}` : "Create keychain credential"}
      size="xl"
      formId={`keychain-credential-form-${kc?.id ?? "new"}`}
      formClassName="space-y-4"
      onSubmit={form.modalSubmit(async (v) => {
        await onSave({ name: v.name.trim(), path: v.path.trim(), defaultCredentialId: v.defaultCredentialId || null });
        onClose();
      })}
      submitLabel={kc ? "Save Changes" : "Create"}
      submitId={`save-keychain-credential-button-${kc?.id ?? "new"}`}
    >
      <TextInput
        label="Name"
        hint="A descriptive name for this keychain credential"
        placeholder="Enter keychain credential name"
        {...form.fieldProps("name")}
      />
      <TextInput
        label="JSONPath Expression"
        hint="JSONPath expression to extract credential selector from run data"
        placeholder="$.user_id"
        {...form.fieldProps("path")}
      />
      <Select
        label="Default Credential"
        hint="Credential to use when JSONPath expression doesn't match"
        options={[["No default credential", ""], ...credentials.map((c): [string, string] => [c.name, c.id])]}
        {...form.fieldProps("defaultCredentialId")}
      />
    </FormModal>
  );
}

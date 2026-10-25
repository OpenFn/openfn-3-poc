import FormModal from "../FormModal";
import NameField from "../NameField";
import { urlSafeName } from "../../utils/format";
import { useForm } from "../../utils/useForm";
import { blank } from "../../utils/validate";

interface Props {
  /** "Create Collection" or "Edit Collection". */
  title: string;
  initialName?: string;
  onCancel: () => void;
  /** Saves the name as typed (the host derives the URL-safe name). Rejects with field errors (`rawName`) or a message, which keep the modal open. */
  onSave: (rawName: string) => Promise<void>;
}

/** Create / edit collection modal (collections_component.ex `form_modal_component`). */
export default function CollectionFormModal({ title, initialName = "", onCancel, onSave }: Props) {
  const form = useForm({
    initial: { rawName: initialName },
    validate: ({ rawName }) => ({ rawName: blank(urlSafeName(rawName)) }),
  });
  return (
    <FormModal
      open
      onClose={onCancel}
      size="md"
      title={title}
      formId="collection-form"
      formClassName=""
      onSubmit={form.modalSubmit(({ rawName }) => onSave(rawName))}
      submitLabel="Save"
    >
      <NameField
        id="collection_raw_name"
        required
        {...form.fieldProps("rawName")}
        badgeLabel="Your collection will be named"
      />
    </FormModal>
  );
}

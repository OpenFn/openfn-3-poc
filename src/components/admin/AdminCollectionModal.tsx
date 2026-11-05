import type { CollectionFormValues } from "@/types/admin";
import { urlSafeName } from "@/utils/format";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import FormModal from "@/components/primitives/FormModal";
import { Select } from "@/components/primitives/Inputs";
import NameField from "@/components/primitives/NameField";

interface Props {
  /** The collection being edited; omit to create one. */
  collection?: { id: string; name: string; projectId: string } | undefined;
  /** The projects it can go in, as [label, id], in the order to offer them. */
  projectOptions: [label: string, value: string][];
  onCancel: () => void;
  /** Saves with the URL-safe name. Rejects with field errors keyed `name`, or a message; either keeps the modal open. */
  onSave: (values: CollectionFormValues) => Promise<void>;
}

/**
 * The superuser create / edit collection modal
 * (collection_live/collection_creation_modal.ex): a name, with the URL-safe
 * name it will get, and the project it belongs to. Editing can move it to
 * another project. Server field errors show on their fields; the page closes
 * the modal and announces success.
 */
export default function AdminCollectionModal({ collection, projectOptions, onCancel, onSave }: Props) {
  const key = collection?.id ?? "new";
  const form = useForm<CollectionFormValues>({
    initial: { name: collection?.name ?? "", project_id: collection?.projectId ?? "" },
    validate: ({ name, project_id }) => ({ name: blank(urlSafeName(name)), project_id: blank(project_id) }),
  });

  return (
    <FormModal
      open
      onClose={onCancel}
      size="xl"
      title={collection ? "Edit collection" : "Create collection"}
      formId={`collection-form-${key}`}
      onSubmit={form.modalSubmit((values) => onSave({ ...values, name: urlSafeName(values.name) }))}
      submitLabel={collection ? "Save changes" : "Create collection"}
      submitId={`save-collection-${key}`}
      cancelId={`cancel-collection-creation-${key}`}
    >
      <NameField
        id="collection_raw_name"
        hint="Collection names must be unique within their project. They are used in URLs and as titles."
        required
        {...form.fieldProps("name")}
        badgeLabel="This collection will be named"
      />
      <Select
        id="collection_project_id"
        label="Project"
        required
        prompt="Select a project"
        options={projectOptions}
        {...form.fieldProps("project_id")}
      />
    </FormModal>
  );
}

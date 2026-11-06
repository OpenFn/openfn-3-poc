import type { SandboxRow, SandboxValues } from "@/types/sandboxes";
import { urlSafeName } from "@/utils/format";
import { useForm } from "@/utils/useForm";
import { blank } from "@/utils/validate";
import FormModal from "@/components/primitives/FormModal";
import NameField from "@/components/primitives/NameField";
import ColorPalette from "./ColorPalette";

/**
 * New sandbox, or rename and recolour one (SandboxLive.FormComponent): a
 * name, shown as the URL-safe name it becomes, and a colour. Only a blank
 * name is checked here; the server checks the rest, and its field errors
 * (`name`) land on the field. The fields are named as the API names them:
 * `name` holds what was typed until it's sent.
 */
export default function SandboxFormModal({
  sandbox,
  parent,
  initialColor,
  onClose,
  onSave,
}: {
  /** The sandbox to edit; left out, the form makes a new one. */
  sandbox?: SandboxRow | undefined;
  /** Where a new sandbox goes: "created under the … project". */
  parent: { name: string; isSandbox: boolean };
  /** A new sandbox's colour until another is picked. */
  initialColor: string;
  onClose: () => void;
  onSave: (values: SandboxValues) => Promise<void>;
}) {
  const f = useForm<SandboxValues>({
    initial: sandbox ? { name: sandbox.name, color: sandbox.color } : { name: "", color: initialColor },
    validate: ({ name }) => ({ name: blank(urlSafeName(name)) }),
  });

  return (
    <FormModal
      open
      onClose={onClose}
      size="md"
      title={sandbox ? `Edit ${sandbox.name}` : "New sandbox"}
      description={
        !sandbox && (
          <>
            This sandbox will be created under the <span className="font-medium">{parent.name}</span> {parent.isSandbox ? "sandbox" : "project"}.
          </>
        )
      }
      formId="sandbox-form"
      onSubmit={f.modalSubmit(({ name, color }) => onSave({ name: urlSafeName(name), color }))}
      submitLabel={sandbox ? "Save" : "Create sandbox"}
      errorHeader="The sandbox wasn't saved"
    >
      <NameField
        id="sandbox_raw_name"
        required
        placeholder="My sandbox"
        {...f.fieldProps("name")}
        exampleName="my-sandbox"
        badgeLabel="Your sandbox will be named"
      />
      <ColorPalette value={f.values.color} onChange={(hex) => f.set("color", hex)} />
    </FormModal>
  );
}

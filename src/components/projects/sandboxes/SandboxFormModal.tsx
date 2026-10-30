import type { SandboxForm, SandboxValues } from "../../../types/sandboxes";
import { urlSafeName } from "../../../utils/format";
import { useForm } from "../../../utils/useForm";
import FormModal from "../../primitives/FormModal";
import NameField from "../../primitives/NameField";
import ColorPalette from "./ColorPalette";

/**
 * Create / edit a sandbox (SandboxLive.FormComponent): Name, the URL-safe
 * name it will get, and a colour. New sandboxes say which project they'll
 * sit under. `onSave` rejects with field errors (`rawName`) that show on the
 * field, or a message that shows above the form; on success the host moves
 * the user on, which closes the form.
 */
export default function SandboxFormModal({
  form,
  onClose,
  onSave,
}: {
  form: SandboxForm;
  onClose: () => void;
  onSave: (values: SandboxValues) => Promise<void>;
}) {
  const isNew = form.mode === "new";
  const f = useForm<SandboxValues>({
    initial: isNew ? { rawName: "", color: form.initialColor } : form.initial,
    validate: (v) => (urlSafeName(v.rawName) === "" ? { rawName: ["can't be blank"] } : {}),
  });

  return (
    <FormModal
      open
      onClose={onClose}
      size="md"
      title={isNew ? "Create a new sandbox" : "Edit sandbox"}
      description={
        isNew && (
          <>
            This sandbox will be created under the <span className="font-medium">{form.parentName}</span>{" "}
            {form.parentIsSandbox ? "sandbox" : "project"}.
          </>
        )
      }
      formId="sandbox-form"
      onSubmit={f.modalSubmit(onSave)}
      submitLabel={isNew ? "Create sandbox" : "Save changes"}
    >
      {/* Lightning hides the hint while the name has errors. */}
      <NameField
        id="sandbox_raw_name"
        required
        placeholder="My Sandbox"
        {...f.fieldProps("rawName")}
        hideBadgeOnError
        exampleName="my-sandbox"
        badgeLabel={isNew ? "Your sandbox will be named" : "The sandbox will be named"}
      />
      <ColorPalette value={f.values.color} onChange={(hex) => f.set("color", hex)} />
    </FormModal>
  );
}

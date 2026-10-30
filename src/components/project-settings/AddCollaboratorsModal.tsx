import { useState } from "react";
import Button from "../primitives/Button";
import { FieldError, TextInput } from "../primitives/Inputs";
import IconButton from "../primitives/IconButton";
import FormModal from "../primitives/FormModal";
import RoleSelect from "./RoleSelect";
import type { CollaboratorValues } from "../../types/project-settings";
import type { ProjectRole } from "../../types/projects";
import { isValidEmail } from "../../utils/validate";

interface CollaboratorDraft {
  email: string;
  role: ProjectRole | "";
}

interface Props {
  /** Emails already on the project ("This account is already part of this project"). */
  existingEmails: string[];
  onCancel: () => void;
  /** May be async: the modal shows pending and stays open with the error if it rejects. */
  onSave: (collaborators: CollaboratorValues[]) => void | Promise<void>;
}

/**
 * NewCollaboratorComponent (project_live/new_collaborator_component.html.heex):
 * one or more email + role rows. The page decides which emails belong to
 * existing users and which need an invite.
 */
export default function AddCollaboratorsModal({ existingEmails, onCancel, onSave }: Props) {
  const [rows, setRows] = useState<CollaboratorDraft[]>([{ email: "", role: "" }]);
  const update = (i: number, patch: Partial<CollaboratorDraft>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const errorFor = (r: CollaboratorDraft) => {
    if (r.email && !isValidEmail(r.email)) return "has invalid format";
    if (existingEmails.includes(r.email.toLowerCase())) return "This account is already part of this project";
    return null;
  };
  const valid = rows.every((r) => r.email && r.role && !errorFor(r));

  return (
    <FormModal
      open
      onClose={onCancel}
      title="Add new collaborator(s)"
      description="Enter the email address and role of new collaborator(s) to invite them to this project"
      formId="add_collaborators_modal_form"
      formClassName="space-y-5"
      // Save is only enabled once every row has a role.
      onSubmit={() => onSave(rows as CollaboratorValues[])}
      submitLabel={<>Save Collaborator{rows.length > 1 ? "s" : ""}</>}
      submitId="save_collaborators_button"
      submitDisabled={!valid}
    >
      {rows.map((r, i) => {
        const error = errorFor(r);
        return (
          <div key={i}>
            <div className="flex items-center gap-4">
              <TextInput
                fieldClassName="flex-1"
                aria-label="Email"
                placeholder="email@example.com"
                required
                value={r.email}
                onChange={(e) => update(i, { email: e.target.value })}
              />
              <RoleSelect value={r.role} onChange={(role) => update(i, { role })} />
              {rows.length > 1 && (
                <IconButton icon="hero-minus-circle" label="Remove row" onClick={() => setRows(rows.filter((_, j) => j !== i))} />
              )}
            </div>
            {error && <FieldError>{error}</FieldError>}
          </div>
        );
      })}
      <Button variant="secondary" onClick={() => setRows([...rows, { email: "", role: "" }])} icon="hero-plus-circle">
        Add Additional Collaborator
      </Button>
    </FormModal>
  );
}

import { useState } from "react";
import FormModal from "../FormModal";
import { TextInput } from "../Inputs";
import IconButton from "../IconButton";
import RoleSelect from "./RoleSelect";
import type { CollaboratorValues, InviteValues } from "../../types/project-settings";
import type { ProjectRole } from "../../types/projects";

interface InviteDraft {
  firstName: string;
  lastName: string;
  email: string;
  role: ProjectRole | "";
}

interface Props {
  /** Prefilled from the emails that had no OpenFn account. */
  initial: CollaboratorValues[];
  onCancel: () => void;
  /** May be async: the modal shows pending and stays open with the error if it rejects. */
  onInvite: (invites: InviteValues[]) => void | Promise<void>;
}

/** InviteCollaboratorComponent (project_live/invite_collaborator_component.html.heex). */
export default function InviteCollaboratorsModal({ initial, onCancel, onInvite }: Props) {
  const [rows, setRows] = useState<InviteDraft[]>(
    (initial.length ? initial : [{ email: "", role: "" as const }]).map((r) => ({ firstName: "", lastName: "", ...r }))
  );
  const update = (i: number, patch: Partial<InviteDraft>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const valid = rows.every((r) => r.firstName && r.lastName && r.email && r.role);

  return (
    <FormModal
      open
      onClose={onCancel}
      size="xl"
      title="Invite new user(s) to join OpenFn"
      description="The following users don't have OpenFn accounts, you can invite them to join and grant access to this project"
      formId="invite_collaborators_modal_form"
      formClassName="space-y-5"
      // Submit is only enabled once every row has a role.
      onSubmit={() => onInvite(rows as InviteValues[])}
      submitLabel={<>Invite new user{rows.length > 1 ? "s" : ""}</>}
      submitDisabled={!valid}
    >
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-4">
          <TextInput
            fieldClassName="flex-1"
            aria-label="First Name"
            placeholder="First Name"
            required
            value={r.firstName}
            onChange={(e) => update(i, { firstName: e.target.value })}
          />
          <TextInput
            fieldClassName="flex-1"
            aria-label="Last Name"
            placeholder="Last Name"
            required
            value={r.lastName}
            onChange={(e) => update(i, { lastName: e.target.value })}
          />
          <TextInput
            fieldClassName="flex-1"
            type="email"
            aria-label="Email"
            required
            value={r.email}
            onChange={(e) => update(i, { email: e.target.value })}
          />
          <RoleSelect value={r.role} onChange={(role) => update(i, { role })} />
          {rows.length > 1 && (
            <IconButton icon="hero-minus-circle" label="Remove row" onClick={() => setRows(rows.filter((_, j) => j !== i))} />
          )}
        </div>
      ))}
    </FormModal>
  );
}

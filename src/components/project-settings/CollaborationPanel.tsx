import { useState } from "react";
import Button from "../primitives/Button";
import InfoTooltip from "../primitives/InfoTooltip";
import SectionHeader from "../primitives/SectionHeader";
import { useToast } from "../primitives/Toast";
import Toggle from "../primitives/Toggle";
import AddCollaboratorsModal from "./AddCollaboratorsModal";
import CollaboratorsTable from "./CollaboratorsTable";
import InviteCollaboratorsModal from "./InviteCollaboratorsModal";
import RemoveCollaboratorModal from "./RemoveCollaboratorModal";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import type {
  AddCollaboratorsResult,
  CollaborationSettings,
  CollaboratorRow,
  CollaboratorValues,
  Digest,
  InviteValues,
} from "../../types/project-settings";
import { errorMessage } from "../../utils/errors";
import { useChosenValue } from "../../utils/useChosenValue";

interface Props {
  collaboration: CollaborationSettings;
  sandbox: boolean;
  /** Adds the emails that have OpenFn accounts, and answers with the rest to invite. */
  onAdd: (values: CollaboratorValues[]) => Promise<AddCollaboratorsResult>;
  onInvite: (values: InviteValues[]) => Promise<void>;
  /** Removes a member, after the user has confirmed. */
  onRemove: (id: string) => Promise<void>;
  /** The switch and the viewer's alert selects show the choice at once, and go back if these reject. */
  onSetSupportAccess: (on: boolean) => Promise<void>;
  onSetFailureAlert: (id: string, on: boolean) => Promise<void>;
  onSetDigest: (id: string, digest: Digest) => Promise<void>;
}

type Modal =
  | { kind: "add" }
  | { kind: "invite"; drafts: CollaboratorValues[] }
  | { kind: "remove"; collaborator: CollaboratorRow }
  | null;

/**
 * The Collaboration tab (`#collaboration`, settings.html.heex:570-679).
 * Adding someone with an existing account adds them to the table; the host
 * answers with the emails that have no account, which go on to the invite
 * modal, as in Lightning.
 */
export default function CollaborationPanel({
  collaboration,
  sandbox,
  onAdd,
  onInvite,
  onRemove,
  onSetSupportAccess,
  onSetFailureAlert,
  onSetDigest,
}: Props) {
  const { collaborators, supportAccess, canEditProject, canAddProjectUser, addBlockedReason, canReceiveFailureAlerts } = collaboration;
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);
  const canAdd = canAddProjectUser && addBlockedReason === null;
  const toast = useToast();
  const supportAccessSwitch = useChosenValue(supportAccess, onSetSupportAccess, (e) => toast(errorMessage(e), "danger"));

  return (
    <>
      <SectionHeader
        title="Project collaboration"
        subtitle="View collaborators and manage alert settings for this project."
        permissionsSection={
          canEditProject ? undefined : "collaboration settings, but you can change your notification preferences."
        }
        action={
          <Button
            id="show_collaborators_modal_button"
            size="lg"
            disabled={!canAdd}
            tooltip={canAddProjectUser ? (addBlockedReason ?? undefined) : "You are not authorized to perform this action"}
            onClick={() => setModal({ kind: "add" })}
          >
            Add Collaborator(s)
          </Button>
        }
      />
      {sandbox && <SandboxSettingsBanner scope="local" />}
      {/* settings.ex `support_access_toggle`: only people who can edit the project see it. */}
      {canEditProject && (
        <div className="flex items-center">
          <Toggle checked={supportAccessSwitch.value} onChange={supportAccessSwitch.choose} label="Grant support access" />
          <InfoTooltip title="Granting support access will allow all designated support users for this Lightning instance to access this project with editor permissions." />
        </div>
      )}

      {modal?.kind === "add" && canAddProjectUser && (
        <AddCollaboratorsModal
          existingEmails={collaborators.map((c) => c.email.toLowerCase())}
          onCancel={close}
          onSave={async (values) => {
            const { toInvite } = await onAdd(values);
            setModal(toInvite.length ? { kind: "invite", drafts: toInvite } : null);
          }}
        />
      )}
      {modal?.kind === "invite" && canAddProjectUser && (
        <InviteCollaboratorsModal
          initial={modal.drafts}
          onCancel={close}
          onInvite={async (values) => {
            await onInvite(values);
            close();
          }}
        />
      )}
      {modal?.kind === "remove" && (
        <RemoveCollaboratorModal
          collaborator={modal.collaborator}
          onCancel={close}
          onConfirm={async () => {
            await onRemove(modal.collaborator.id);
            close();
          }}
        />
      )}

      <CollaboratorsTable
        collaborators={collaborators}
        canReceiveFailureAlerts={canReceiveFailureAlerts}
        canAdd={canEditProject}
        onAdd={() => setModal({ kind: "add" })}
        onSetFailureAlert={onSetFailureAlert}
        onSetDigest={onSetDigest}
        onRemove={(collaborator) => setModal({ kind: "remove", collaborator })}
      />
    </>
  );
}

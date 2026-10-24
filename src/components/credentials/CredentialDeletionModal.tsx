import Button from "../Button";
import ConfirmModal from "../ConfirmModal";
import Modal from "../Modal";
import type { CredentialRow } from "../../types/credentials";

interface Props {
  onClose: () => void;
  credential: CredentialRow;
  /** Schedules the deletion, or deletes a scheduled credential now. Rejects with a message, which the modal shows; it stays open. */
  onDelete: () => Promise<void>;
}

const activityNote =
  "This credential has been used in workflow runs that are still monitored in at least one project's audit trail. The credential will be made unavailable for future use immediately and after a cooling-off period all secrets will be permanently scrubbed, but the record itself will not be removed until related workflow runs have been purged.";

/**
 * Lightning's CredentialDeletionModal (live/components/credential_deletion_modal.ex),
 * built like UserDeletionModal: a ConfirmModal, or, when a scheduled
 * credential still has audited runs and so can't be deleted now, a notice.
 * Lightning asks for no typed confirmation here, so neither does this.
 */
export default function CredentialDeletionModal({ onClose, credential, onDelete }: Props) {
  if (credential.scheduledDeletion && credential.hasActivityInProjects) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Credential marked for deletion"
        size="sm"
        footer={
          <Button theme="secondary" onClick={onClose}>
            Ok, understood
          </Button>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>{activityNote}</p>
          <p>Contact your instance administrator for more details.</p>
        </div>
      </Modal>
    );
  }
  return (
    <ConfirmModal
      open
      onClose={onClose}
      title="Delete credential"
      tone="danger"
      confirmLabel="Delete credential"
      confirmId={`delete-credential-${credential.id}-modal_confirm_button`}
      onConfirm={onDelete}
    >
      <p>
        Deleting this credential will immediately remove it from all jobs and projects. If you later restore it, you
        will need to re-share it with projects and re-associate it with jobs. Are you sure you'd like to delete the
        credential?
      </p>
      {credential.hasActivityInProjects && <p className="italic">*{activityNote}</p>}
    </ConfirmModal>
  );
}

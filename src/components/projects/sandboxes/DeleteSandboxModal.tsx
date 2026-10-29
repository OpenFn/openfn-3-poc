import Alert from "../../Alert";
import ConfirmModal from "../../ConfirmModal";
import { formatGracePeriod } from "../../../utils/format";

/**
 * "Delete sandbox" (SandboxLive.Components.confirm_delete_modal): what gets
 * removed, how many child sandboxes go with it, the grace period, and a
 * type-the-name confirmation that enables the red button.
 */
export default function DeleteSandboxModal({
  sandboxName,
  descendantCount = 0,
  isCurrent = false,
  rootName,
  gracePeriodDays,
  onClose,
  onConfirm,
}: {
  sandboxName: string;
  descendantCount?: number;
  isCurrent?: boolean;
  rootName: string;
  /** Lightning's `purge_deleted_after_days`, or null when it isn't set. */
  gracePeriodDays: number | null;
  onClose: () => void;
  /** Called with the typed name. */
  onConfirm?: (typed: string) => void | Promise<void>;
}) {
  return (
    <ConfirmModal
      open
      onClose={onClose}
      onConfirm={(typed) => onConfirm?.(typed)}
      title="Delete sandbox"
      confirmLabel="Delete sandbox"
      tone="danger"
      formId="confirm-delete-sandbox-form"
      confirmation={{
        id: "confirm-delete-name-input",
        label: "Sandbox name",
        expected: sandboxName,
        placeholder: sandboxName,
        required: true,
        disabledTooltip: "Type the sandbox name to enable",
      }}
    >
      <p>
        Deleting a sandbox removes it from OpenFn.
        {descendantCount === 1 && <span> Its child sandbox will also be deleted.</span>}
        {descendantCount > 1 && <span> Its {descendantCount} child sandboxes will also be deleted.</span>}
      </p>
      <p>Workflows, triggers, versions, keychain clones, and dataclips will be permanently removed.</p>
      {isCurrent && (
        <p>
          You are currently viewing this project. After deletion, you'll be redirected to <strong>{rootName}</strong>.
        </p>
      )}
      <p>To confirm, type the sandbox name below.</p>
      <Alert tone="warning">
        This sandbox will be retained for {formatGracePeriod(gracePeriodDays)} before being permanently removed. You can restore it
        from the sandbox list during that window.
      </Alert>
    </ConfirmModal>
  );
}

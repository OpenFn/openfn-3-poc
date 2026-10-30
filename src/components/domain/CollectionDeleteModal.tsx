import ConfirmModal from "../primitives/ConfirmModal";

interface Props {
  collection: { name: string };
  onCancel: () => void;
  /** May be async: the modal shows pending and stays open with the error if it throws. */
  onDelete: () => void | Promise<void>;
}

/** collections_component.ex `collection_deletion_modal`. */
export default function CollectionDeleteModal({ collection, onCancel, onDelete }: Props) {
  return (
    <ConfirmModal open onClose={onCancel} onConfirm={onDelete} title="Delete collection" confirmLabel="Delete" tone="danger">
      <p>
        Are you sure you want to delete the collection <span className="font-medium">{collection.name}</span> ? If you
        wish to proceed with this action, click on the delete button. To cancel click on the cancel button.
      </p>
    </ConfirmModal>
  );
}

import Modal from "../Modal";
import TextLink from "../TextLink";

interface Props {
  name: string;
  /** The first record, pretty-printed; null when the collection is empty. */
  json: string | null;
  onClose: () => void;
}

/**
 * collections_component.ex `collection_preview_modal`: the first record as
 * JSON. Lightning renders it in a Monaco viewer; this uses a plain <pre>.
 */
export default function CollectionPreviewModal({ name, json, onClose }: Props) {
  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={`Collection Preview: ${name}`}
      description={
        <>
          Showing first record. We recommend{" "}
          <TextLink href="https://docs.openfn.org/documentation/collections-cli" external>
            using the CLI
          </TextLink>{" "}
          to manage collections.
        </>
      }
    >
      {json ? (
        <pre className="h-96 overflow-auto rounded-md bg-code p-4 text-xs text-code">{json}</pre>
      ) : (
        <p className="flex h-96 items-center justify-center text-sm text-faint">This collection is empty.</p>
      )}
    </Modal>
  );
}

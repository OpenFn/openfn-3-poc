import { useState } from "react";
import Button from "../Button";
import SectionHeader from "../SectionHeader";
import CollectionDeleteModal from "./CollectionDeleteModal";
import CollectionFormModal from "./CollectionFormModal";
import CollectionPreviewModal from "./CollectionPreviewModal";
import CollectionsTable from "./CollectionsTable";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import type { CollectionRow, CollectionsSettings } from "../../types/project-settings";
import { useAction } from "../../utils/useAction";

interface Props {
  collections: CollectionsSettings;
  sandbox: boolean;
  /** Creates a collection from the name as typed. Rejects with field errors or a message, which keep the modal open. */
  onCreate: (rawName: string) => Promise<void>;
  onRename: (id: string, rawName: string) => Promise<void>;
  /** Deletes a collection, after the user has confirmed. */
  onDelete: (id: string) => Promise<void>;
  /** The collection's first record, pretty-printed, or null when it's empty. */
  onPreview: (id: string) => Promise<string | null>;
}

type Action =
  | { kind: "new" }
  | { kind: "edit" | "delete"; collection: CollectionRow }
  | { kind: "preview"; collection: CollectionRow; json: string | null }
  | null;

/** The Collections tab (`#collections`, project_live/collections_component.ex). */
export default function CollectionsPanel({ collections: { collections, canManage }, sandbox, onCreate, onRename, onDelete, onPreview }: Props) {
  const [action, setAction] = useState<Action>(null);
  const close = () => setAction(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const preview = useAction(
    async (collection: CollectionRow) => setAction({ kind: "preview", collection, json: await onPreview(collection.id) }),
    { onError: "toast" }
  );

  return (
    <div id="collections" className="space-y-4">
      <SectionHeader
        title="Project collections"
        subtitle="Manage collections for this project."
        permissionsSection={canManage ? undefined : "available collections."}
        action={
          <Button
            id="open-create-collection-modal-button"
            size="lg"
            disabled={!canManage}
            onClick={() => setAction({ kind: "new" })}
          >
            Create collection
          </Button>
        }
      />
      {sandbox && <SandboxSettingsBanner variant="editable" />}

      {action?.kind === "new" && (
        <CollectionFormModal
          title="Create Collection"
          onCancel={close}
          onSave={async (rawName) => {
            await onCreate(rawName);
            close();
          }}
        />
      )}
      {action?.kind === "edit" && (
        <CollectionFormModal
          title="Edit Collection"
          initialName={action.collection.name}
          onCancel={close}
          onSave={async (rawName) => {
            await onRename(action.collection.id, rawName);
            close();
          }}
        />
      )}
      {action?.kind === "delete" && (
        <CollectionDeleteModal
          collection={action.collection}
          onCancel={close}
          onDelete={async () => {
            await onDelete(action.collection.id);
            close();
          }}
        />
      )}
      {action?.kind === "preview" && (
        <CollectionPreviewModal name={action.collection.name} json={action.json} onClose={close} />
      )}

      <CollectionsTable
        collections={collections}
        canManage={canManage}
        onCreate={() => setAction({ kind: "new" })}
        previewingId={preview.pending ? previewingId : null}
        onPreview={(collection) => {
          setPreviewingId(collection.id);
          void preview.run(collection);
        }}
        onEdit={(collection) => setAction({ kind: "edit", collection })}
        onDelete={(collection) => setAction({ kind: "delete", collection })}
      />
    </div>
  );
}

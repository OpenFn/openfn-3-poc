import { useState } from "react";
import Button from "@/components/primitives/Button";
import ListPage from "@/components/patterns/ListPage";
import { useToast } from "@/components/primitives/Toast";
import AdminCollectionModal from "@/components/admin/AdminCollectionModal";
import AdminCollectionsTable from "@/components/admin/AdminCollectionsTable";
import type { AdminCollectionRow, CollectionFormValues, CollectionSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";

/** What its .query file passes in: data and the actions that change it. */
export interface AdminCollectionsPageProps {
  /** Where loading the collections and the projects stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** Every collection on the instance, in the order the server sorted them. */
  collections: AdminCollectionRow[];
  /** The order `collections` came in. */
  sort: SortState<CollectionSortKey>;
  /** Asks for another order. */
  onSort: (sort: SortState<CollectionSortKey>) => void;
  /** Every project a collection can go in, as [label, id], in the order to offer them. */
  projectOptions: [label: string, value: string][];
  /** Creates a collection. */
  onCreate: (values: CollectionFormValues) => Promise<void>;
  /** Renames a collection, or moves it to the project in `values`. */
  onUpdate: (id: string, values: CollectionFormValues) => Promise<void>;
}

/**
 * Inventory view `admin-collections` (CollectionLive.Index): every collection
 * on the instance with its project and storage, and the create and edit modal.
 */
export default function AdminCollectionsPage({
  status,
  collections,
  sort,
  onSort,
  projectOptions,
  onCreate,
  onUpdate,
}: AdminCollectionsPageProps) {
  const toast = useToast();
  const [open, setOpen] = useState<AdminCollectionRow | "new">();
  const editing = open === "new" ? undefined : open;
  const close = () => setOpen(undefined);

  return (
    <ListPage
      title="Collections"
      showCount
      description="Every collection on this instance, across all projects."
      actions={
        <Button id="open-create-collection-modal-button" onClick={() => setOpen("new")}>
          Create collection
        </Button>
      }
      status={status}
      itemCount={collections.length}
      empty={{ icon: "hero-circle-stack", message: "No collections yet." }}
      list={<AdminCollectionsTable collections={collections} sort={sort} onSort={onSort} onEdit={setOpen} />}
    >
      {open && (
        <AdminCollectionModal
          key={editing?.id ?? "new"}
          collection={editing}
          projectOptions={projectOptions}
          onCancel={close}
          onSave={async (values) => {
            if (editing) await onUpdate(editing.id, values);
            else await onCreate(values);
            close();
            toast(editing ? "Collection updated successfully" : "Collection created successfully");
          }}
        />
      )}
    </ListPage>
  );
}

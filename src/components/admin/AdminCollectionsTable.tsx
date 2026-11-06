import type { AdminCollectionRow, CollectionSortKey } from "@/types/admin";
import type { SortState } from "@/types/lists";
import { formatBytes } from "@/utils/format";
import { serverSortThProps } from "@/utils/useTableSort";
import Button from "@/components/primitives/Button";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";

interface Props {
  collections: AdminCollectionRow[];
  /** The order the server listed `collections` in. */
  sort: SortState<CollectionSortKey>;
  onSort: (sort: SortState<CollectionSortKey>) => void;
  onEdit: (collection: AdminCollectionRow) => void;
}

/**
 * The instance-wide collections table (collection_live/components.ex
 * `collections_table`): name / project / size with Edit and Delete
 * per row. Delete is disabled until the API
 * lets a superuser delete any collection. Ids are Lightning's.
 */
export default function AdminCollectionsTable({ collections, sort, onSort, onEdit }: Props) {
  const thProps = serverSortThProps(sort, onSort);

  return (
    <Table
      id="collections-table"
      header={
        <Tr>
          <Th {...thProps("name")}>Name</Th>
          <Th>Project</Th>
          <Th {...thProps("byte_size_sum")}>Size</Th>
          <Th actions />
        </Tr>
      }
    >
      {collections.map((collection) => (
        <Tr key={collection.id} id={`collections-table-row-${collection.id}`}>
          {/* eslint-disable-next-line local/primitive-classname -- debt: colour (text-strong) */}
          <Td wrap maxWidth={60} className="text-strong">{collection.name}</Td>
          <Td wrap maxWidth={100}>{collection.projectName}</Td>
          <Td wrap maxWidth={100}>{formatBytes(collection.byteSizeSum)}</Td>
          <Td actions>
            <Button
              id={`edit-collection-${collection.id}-button`}
              aria-label={`Edit ${collection.name} in ${collection.projectName}`}
              variant="secondary"
              size="xs"
              onClick={() => onEdit(collection)}
            >
              Edit
            </Button>
            <Button
              id={`delete-collection-${collection.id}-button`}
              aria-label={`Delete ${collection.name} in ${collection.projectName}`}
              variant="secondary"
              size="xs"
              disabled
              tooltip="Not available in the API yet"
            >
              Delete
            </Button>
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

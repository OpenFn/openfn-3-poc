import type { SortState } from "@/types/lists";
import type { WorkflowListItem, WorkflowSortKey } from "@/types/workflows";
import { RowLink, Table, Td, Th, Tr } from "@/components/primitives/Table";
import DateTime from "@/components/primitives/DateTime";
import WorkOrderStatus from "./WorkOrderStatus";

/**
 * A project's workflows: name, latest run and last updated. The server sorts:
 * a header click calls `onSort` (the current column flips, another starts
 * ascending), so a sort dropdown could replace the headers without changing
 * what the page takes. A row opens the workflow editor. ListPage shows the
 * empty state, so this always draws the table.
 */
export default function WorkflowsTable({
  projectId,
  workflows,
  sort,
  onSort,
}: {
  projectId: string;
  workflows: WorkflowListItem[];
  /** The order the server listed `workflows` in. */
  sort: SortState<WorkflowSortKey>;
  onSort: (sort: SortState<WorkflowSortKey>) => void;
}) {
  const thProps = (key: WorkflowSortKey) => {
    const current = sort.key === key;
    return {
      sortDirection: current ? sort.direction : null,
      onSort: () => onSort({ key, direction: current && sort.direction === "asc" ? "desc" : "asc" }),
    };
  };

  return (
    <Table
      id="workflows-table"
      header={
        <Tr>
          <Th {...thProps("name")}>Name</Th>
          <Th {...thProps("last_work_order_updated_at")}>Latest run</Th>
          <Th {...thProps("updated_at")}>Last updated</Th>
        </Tr>
      }
    >
      {workflows.map((w) => (
        <Tr key={w.id} id={`workflow-${w.id}`}>
          <Td maxWidth={60}>
            <RowLink to={`/projects/${projectId}/w/${w.id}`}>{w.name}</RowLink>
          </Td>
          <Td>
            <WorkOrderStatus state={w.lastWorkOrder?.state ?? null} updatedAt={w.lastWorkOrder?.updatedAt} />
          </Td>
          <Td>
            <DateTime value={w.updatedAt} />
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

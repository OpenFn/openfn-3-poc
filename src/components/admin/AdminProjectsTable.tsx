import type { AdminProjectRow, AdminProjectSortKey } from "@/types/admin";
import type { PageLinks, SortState } from "@/types/lists";
import { formatUtcDate } from "@/utils/format";
import Button from "@/components/primitives/Button";
import IconButton from "@/components/primitives/IconButton";
import Menu, { MenuItem } from "@/components/primitives/Menu";
import Pagination from "@/components/primitives/Pagination";
import Pill from "@/components/primitives/Pill";
import { Row } from "@/components/primitives/Stack";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";

interface Props {
  projects: AdminProjectRow[];
  page: PageLinks;
  /** The order the server listed `projects` in. */
  sort: SortState<AdminProjectSortKey>;
  onSort: (sort: SortState<AdminProjectSortKey>) => void;
  /** Where a project's Delete goes. */
  deleteHref: (id: string) => string;
  onCancelDeletion: (id: string) => void;
  /** Whether this project's Cancel deletion is waiting on the server. */
  cancelling: (id: string) => boolean;
}

/**
 * Every project on the instance, a page at a time: its owner, how many
 * members it has, when it was made and when it's due to be deleted. A live
 * project's row has Delete; a scheduled one's has Cancel deletion, and Delete
 * now in its ••• menu, disabled until the API can purge a project.
 */
export default function AdminProjectsTable({ projects, page, sort, onSort, deleteHref, onCancelDeletion, cancelling }: Props) {
  const thProps = (key: AdminProjectSortKey) => {
    const current = sort.key === key;
    return {
      sortDirection: current ? sort.direction : null,
      onSort: () => onSort({ key, direction: current && sort.direction === "asc" ? "desc" : "asc" }),
    };
  };

  return (
    <Table
      id="projects"
      header={
        <Tr>
          <Th {...thProps("name")}>Project</Th>
          <Th>Owner</Th>
          <Th align="right">Members</Th>
          <Th {...thProps("inserted_at")}>Created</Th>
          <Th actions />
        </Tr>
      }
      footer={<Pagination page={page} />}
    >
      {projects.map((project) => (
        <Tr key={project.id} id={`project-row-${project.id}`}>
          <Td wrap maxWidth={80}>
            <Row wrap>
              <Text tone="strong">{project.name}</Text>
              {project.scheduledDeletion && <Pill tone="danger">Deletes {formatUtcDate(project.scheduledDeletion)}</Pill>}
            </Row>
          </Td>
          <Td truncate>{project.ownerName ?? <Text tone="muted">No owner</Text>}</Td>
          <Td align="right">{project.membersCount}</Td>
          <Td>{formatUtcDate(project.insertedAt)}</Td>
          <Td actions>
            {project.scheduledDeletion ? (
              <>
                <Button
                  variant="secondary"
                  size="xs"
                  aria-label={`Cancel deletion of ${project.name}`}
                  pending={cancelling(project.id)}
                  onClick={() => onCancelDeletion(project.id)}
                >
                  Cancel deletion
                </Button>
                <Menu trigger={<IconButton icon="hero-ellipsis-horizontal" label={`More actions for ${project.name}`} />}>
                  <MenuItem disabled description="Not available in the API yet">
                    Delete now
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button variant="secondary" size="xs" aria-label={`Delete ${project.name}`} to={deleteHref(project.id)}>
                Delete
              </Button>
            )}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

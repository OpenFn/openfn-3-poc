import { Fragment } from "react";
import type { AuditEvent } from "@/types/admin";
import type { PageLinks } from "@/types/lists";
import { shortUuid } from "@/utils/format";
import Pagination from "@/components/primitives/Pagination";
import Pill from "@/components/primitives/Pill";
import DateTime from "@/components/primitives/DateTime";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Text from "@/components/primitives/Text";
import AuditChanges from "./AuditChanges";

function TwoLine({ label, sub }: { label: string; sub: string }) {
  return (
    <>
      <div className="truncate text-strong">{label}</div>
      <Text as="div" variant="body-sm" className="truncate">
        {sub}
      </Text>
    </>
  );
}

/**
 * The superuser audit trail (audit_live/index.html.heex): one row per event
 * (when, event pill, actor, subject) with its change strip underneath, and
 * the pagination bar.
 */
export default function AuditTable({
  events,
  page,
}: {
  /** The events on this page. */
  events: AuditEvent[];
  page: PageLinks;
}) {
  return (
    <Table
      variant="plain"
      header={
        <Tr>
          <Th>Occurred</Th>
          <Th>Event</Th>
          <Th>Actor</Th>
          <Th>Subject</Th>
        </Tr>
      }
      footer={<Pagination page={page} />}
    >
      {events.map((audit) => (
        <Fragment key={audit.id}>
          {/* eslint-disable-next-line local/primitive-classname -- debt: box (border-t border-subtle) */}
          <Tr className="border-t border-subtle">
            <Td>
              <DateTime value={audit.insertedAt} />
            </Td>
            <Td>
              <Pill color="green">{audit.event}</Pill>
            </Td>
            <Td>
              <TwoLine label={audit.actorLabel} sub={audit.actorIdentifier ?? shortUuid(audit.actorId)} />
            </Td>
            <Td>
              <TwoLine label={audit.itemType.split(".").pop() ?? ""} sub={shortUuid(audit.itemId)} />
            </Td>
          </Tr>
          <Tr>
            <AuditChanges audit={audit} />
          </Tr>
        </Fragment>
      ))}
    </Table>
  );
}

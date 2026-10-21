import Header from "../../components/Header";
import { Centered, PageContent } from "../../components/PageContent";
import AuditTable from "../../components/admin/AuditTable";
import type { AuditEvent } from "../../types/admin";

/** The contract between this page and whatever feeds it (the replica wrapper, later Lightning). */
export interface AdminAuditPageProps {
  /** The audit events on the current page, newest first, as the server pages them. */
  events: AuditEvent[];
  /** The current page, from 1 (`?page=`). */
  pageNumber: number;
  /** Events per page. */
  pageSize: number;
  /** Events across all pages. */
  totalEntries: number;
  /** Goes to another page. */
  onPage: (page: number) => void;
}

/**
 * Inventory view `admin-audit` (AuditLive.Index): /settings/audit. Props
 * only, so it can run unchanged in Lightning; the replica's data and URL
 * state live in AdminAuditPage.replica.tsx.
 */
export default function AdminAuditPage({ events, pageNumber, pageSize, totalEntries, onPage }: AdminAuditPageProps) {
  return (
    <PageContent header={<Header title="Audit" />}>
      <Centered>
        <AuditTable
          events={events}
          pageNumber={pageNumber}
          pageSize={pageSize}
          totalEntries={totalEntries}
          onPage={onPage}
        />
      </Centered>
    </PageContent>
  );
}

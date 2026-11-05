import ListPage from "@/components/patterns/ListPage";
import AuditTable from "@/components/admin/AuditTable";
import type { AuditEvent } from "@/types/admin";
import type { PageLinks } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";

/** The contract between this page and whatever feeds it (AdminAuditPage.query.tsx). */
export interface AdminAuditPageProps {
  /** The audit events on the current page, newest first, as the server pages them. */
  events: AuditEvent[];
  /** The current page (`?page=`); the page links to the others. */
  page: PageLinks;
  /** Where loading the page stands: a spinner, No Access for a non-superuser, or the server's message. */
  status: ResourceStatus;
}

/**
 * Inventory view `admin-audit` (AuditLive.Index): /settings/audit. Props
 * only; the data and the URL's page come from AdminAuditPage.query.tsx.
 */
export default function AdminAuditPage({ events, page, status }: AdminAuditPageProps) {
  return (
    <ListPage
      title="Audit"
      status={status}
      itemCount={events.length}
      empty={{ icon: "hero-clipboard-document-list", message: "No results found" }}
      list={<AuditTable events={events} page={page} />}
    />
  );
}

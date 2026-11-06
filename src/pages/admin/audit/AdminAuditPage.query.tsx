import { useAuditEvents } from "@/api/auditEvents";
import { pageParam, useUrlParams } from "@/utils/useUrlParams";
import AdminAuditPage from "./AdminAuditPage";

/**
 * AdminAuditPage's query: the page of the audit trail `?page=` asks for,
 * from the API. The server pages it and moves an overflow page back to the last.
 */
export default function AdminAuditPageQuery() {
  const { params } = useUrlParams<"page">();
  const { status, events, page } = useAuditEvents(pageParam(params.page));
  return <AdminAuditPage status={status} events={events} page={page} />;
}

/** Audit events on Lightning's API (api/audit-events.md): the API's shape, its mapper, its keys, and the hook a .query file calls. */
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AuditEvent, AuditValue } from "@/types/admin";
import type { PageLinks } from "@/types/lists";
import type { ResourceStatus } from "@/types/resource";
import { request, statusOf } from "./client";

/** An event as `GET /api/audit_events` lists it. */
export interface ApiAuditEvent {
  id: string;
  attributes: {
    event: string;
    item_type: string;
    item_id: string;
    actor_id: string;
    /** "Ada Lovelace (ada@example.com)", or a label alone ("Lightning", "(User deleted)"). */
    actor_display: string;
    changes: { before: Record<string, AuditValue> | null; after: Record<string, AuditValue> | null };
    inserted_at: string;
  };
}

/** One page of the list. It has links but no total (api/conventions.md). */
interface ApiAuditPage {
  data: ApiAuditEvent[];
  links: { self: string; last: string };
}

// The `page` and `page_size` a page link carries.
const pageOf = (link: string, param: "page" | "page_size") => Number(new URL(link).searchParams.get(param));

/**
 * A row of the audit table. The API sends the actor as one string, so it's the
 * label and the table shows the actor's short id under it (gap: the API should
 * send actor_label and actor_identifier apart). Credential bodies aren't sent.
 */
export function auditEvent({ id, attributes: a }: ApiAuditEvent): AuditEvent {
  return {
    id,
    insertedAt: a.inserted_at,
    event: a.event,
    itemType: a.item_type,
    itemId: a.item_id,
    actorId: a.actor_id,
    actorLabel: a.actor_display,
    actorIdentifier: null,
    changes: a.changes,
  };
}

export const auditEventKeys = { all: ["audit_events"] as const };

/** One page of the instance's audit trail, newest first, as the server pages it, and where loading it stands. */
export function useAuditEvents(page: number): { status: ResourceStatus; events: AuditEvent[]; page: PageLinks } {
  const query = useQuery({
    queryKey: [...auditEventKeys.all, page],
    queryFn: () => request<ApiAuditPage>("GET", `/api/audit_events?page=${page}`),
    select: (answer) => ({
      events: answer.data.map(auditEvent),
      // The page the server answered (it moves an overflow page back to the last), and the last from its link.
      page: { number: pageOf(answer.links.self, "page"), size: pageOf(answer.links.self, "page_size"), totalPages: pageOf(answer.links.last, "page") },
    }),
    // Paging keeps the old rows on screen until the next page arrives.
    placeholderData: keepPreviousData,
  });
  return { status: statusOf(query), events: query.data?.events ?? [], page: query.data?.page ?? { number: page, size: 10, totalPages: 1 } };
}

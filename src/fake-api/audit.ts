/** The audit trail on the pretend server (api/audit-events.md). */
import { auditEvents } from "@/mock-data/admin";
import { session } from "@/mock-data/users";
import { forbidden, json, paged, type Handler } from "./answers";

// As the route answers an event: the actor as one string, no credential bodies.
const entry = (e: (typeof auditEvents)[number]) => ({
  type: "audit_events",
  id: e.id,
  attributes: {
    event: e.event,
    item_type: e.itemType,
    item_id: e.itemId,
    actor_type: "user",
    actor_id: e.actorId,
    actor_display: e.actorIdentifier ? `${e.actorLabel} (${e.actorIdentifier})` : e.actorLabel,
    changes: e.changes,
    metadata: {},
    inserted_at: e.insertedAt,
  },
  relationships: {},
  links: {},
});

export const auditRoutes: Record<string, Handler> = {
  // Superusers only. The filters aren't here: no page sends them yet.
  "GET /api/audit_events": (_params, _body, query) => {
    if (session.user.role !== "superuser") return forbidden();
    return json(200, { ...paged("/api/audit_events", auditEvents.map(entry), query), included: [] });
  },
};

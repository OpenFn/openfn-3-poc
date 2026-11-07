# Audit events

Lightning records an audit event when someone changes a project, workflow,
credential, user and some other records. Events are never changed or deleted.

## List audit events

Status: **Private**

```
GET /api/audit_events
```

Tokens: any token of a superuser, or service account with `audit:read`.
Anyone else gets 403 `forbidden`. Paged, newest first.

| Parameter | Notes |
| --- | --- |
| `item_type` | For example `project`, `workflow` or `credential`. |
| `item_id` | UUID. |
| `actor_id` | UUID. |
| `event` | For example `created`, `updated` or `deleted`. |
| `inserted_after`, `inserted_before` | ISO 8601. Both exclusive. |

A parameter that isn't a UUID or a timestamp where one is needed answers 400
`invalid_parameter`, with an entry for every bad one.

Each event:

```json
{
  "type": "audit_events",
  "id": "…",
  "attributes": {
    "event": "updated",
    "item_type": "project",
    "item_id": "…",
    "actor_type": "user",
    "actor_id": "…",
    "actor_display": "Ada Lovelace (ada@example.com)",
    "changes": {
      "before": { "description": "Malaria reporting" },
      "after": { "description": "Malaria case reporting" }
    },
    "metadata": {},
    "inserted_at": "…"
  },
  "relationships": {},
  "links": {}
}
```

- `actor_type` is `user`, `service_account`, `trigger` or
  `project_repo_connection`. `actor_display` names the actor, with its email
  or id in brackets where there is one, or says it has been deleted.
- `changes` holds only the fields that changed. `before` is `null` on a
  `created` event, and both are `null` on an event that records no changes.
- Credential bodies recorded in an event's `metadata` are left out, and so are
  secrets in `changes`: an OAuth client's `client_secret`, and a webhook auth
  method's `username`, `password` and `api_key`.

# API gaps: what a page shows that api/ doesn't have

One entry per thing Brandon's ia-demo design, or Lightning's page where he
has no screen, shows that no route in `api/` (planned scope included) can give. Each says where it shows, what it
would need, and what the replica does until then (usually: leaves it out).
The replica's pages map a gap to "none"; they never fake it.

## Workflows list (ia-demo `ProjectWorkflowsPage`, `WorkflowRow`)

- **Members: who edited each workflow, most recent first** (an avatar stack).
  `api/workflows.md` has no editors on a workflow; the only record of who
  changed what is audit events, which aren't on the list route. Would need
  something like `editors` (user ids or names, newest first) on each workflow,
  perhaps under `include=stats`. Replica: column left out.
- **Service status (Live / Draft)** on a workflow that backs a service. There
  are no services in the API at all; in ia-demo it sits behind the
  `serviceCatalog` flag. Replica: left out.
- **A description under each workflow's name.** The workflow object in
  `api/workflows.md` has no `description`. Would need a `description` field on
  the workflow, set through create and update. Replica: left out.

## Audit trail (Lightning's `AuditLive.Index`, /settings/audit)

- **The total.** Lightning's page says "Showing 11 to 20 of 24 total
  results". `GET /api/audit_events` sends links but no `meta`, which runs
  and work orders have. Would need `meta.total_entries`; Lightning's query
  already counts it (`Repo.paginate`). Replica: "Page 2 of 3", the last page
  from `links.last`.
- **The actor as two parts.** Lightning's page puts the email under the name.
  The API joins them into one `actor_display` ("Ada Lovelace
  (ada@example.com)"), though Lightning holds them apart until then. Would
  need `actor_label` and `actor_identifier`. Replica: the string on one line,
  the actor's short id under it.
- **Secrets in `changes`: we think the API leaves them out on purpose.**
  The full-api-test branch drops OAuth client secrets and webhook auth
  usernames, passwords and API keys from `changes`
  (`audit_event_json.ex`); `api/audit-events.md` names only credential
  bodies. The doc should say so. Replica: shows `changes` as sent; no fake
  event holds one yet.

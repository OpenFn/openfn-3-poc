# API gaps: what the replica needs that api/ doesn't have

One entry per thing the replica needs that `api/` (planned scope included)
can't give: a field Brandon's ia-demo design shows, something Lightning's
own page has, or a hole in the contract itself (a missing error code). Each
says where it shows, what it would need, and what the replica does until
then (usually: leaves it out). The replica's pages map a gap to "none";
they never fake it.

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

## Profile (Lightning's `ProfileLive.Edit`, /profile)

- **Whether a GitHub connection has lapsed.** Lightning shows "Reconnect"
  when the token is there but no longer works. `github` on `GET /api/me` has
  `connected` and `expires_at`, but doesn't say what a lapsed token looks
  like. Would need a `status` (`connected`, `expired`, `none`) or a stated
  rule. Replica: reads `connected: false` with an `expires_at` as lapsed.
- **A superuser scheduling their own deletion.** Lightning refuses it
  (`User.scheduled_deletion_changeset`), but the planned self-deletion in
  `api/users.md` doesn't say how. Would need a stated refusal, such as 403
  `forbidden`. Replica: the fake answers that, and the dialog shows its
  `detail`.
- **Whether your deletion can go ahead.** Lightning blocks deleting an
  account that is already scheduled and still has project activity. The
  browser works that out from `scheduled_deletion` and
  `has_activity_in_projects` on `GET /api/me`, which re-does a server rule.
  Would need a `deletion_blocked` (or the refusal as a stated 409). Replica:
  the mapper in `src/api/session.ts` works it out.

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

## Login (Lightning's `auth-login`)

Not from Brandon's design: Lightning's own login form has this, and the API
doesn't.

- **Remember me** ("Keep me logged in for 60 days"). `POST /api/session` has
  no `remember_me` field, and the session cookie's lifetime is Lightning's
  to set. Would need a `remember_me` boolean on sign in. Replica: checkbox
  left out (docs/lightning-differences.md).

## Session tokens (api/authentication.md, api/errors.md)

- **No error code for a missing or wrong CSRF token.** Writes on a session
  token need `x-csrf-token`, but api/errors.md has no code for one that
  doesn't match, so the only answer left is 403 `forbidden`, which means
  "you may not do this". The app can't tell "your session changed in
  another tab" from "not allowed". Would need a 403 `invalid_csrf_token` in
  the response codes. Replica: the fake server answers `forbidden`, and
  `client.ts` forgets its token on any refused write, so the next one asks
  for the current token. It never resends: the new session may be someone
  else's.

## Project access (api/projects.md, api/errors.md)

- **No error code for a project's MFA requirement.** A member who hasn't set
  up MFA gets 403 `forbidden` from every route on a project that requires
  it, the same answer as a non-member. Lightning sends that member to
  /mfa_required to set it up; the app can't tell the two apart from the
  answer. Would need a 403 `mfa_required` on project routes. Replica:
  `useRefusedForMfa` (`src/api/projects.ts`) reads the project list, which
  holds every project you're a member of: a listed project that requires
  MFA and still refuses you is the requirement, so ProjectGate sends you to
  /mfa_required. It leans on `requires_mfa` in the list, which is planned:
  until Lightning sends it, everyone refused sees No Access. And it breaks
  once the planned superuser scope lists every project: a superuser who
  isn't a member of an MFA project would be sent to set up MFA, though that
  wouldn't let them in.

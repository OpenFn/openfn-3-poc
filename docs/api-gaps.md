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
  until Lightning sends it, everyone refused sees No Access. It holds only
  while a superuser's list is their own projects (Superuser access).

## Superuser access (api/projects.md, api/collections.md)

- **Needed: the planned superuser scope on `GET /api/projects` must be
  opt-in** (e.g. `scope=all`); as planned, every superuser's dashboard and
  project picker would list the whole instance, where Lightning shows only
  the admin page that. It would also break the MFA check above: a superuser
  who isn't a member of a project that requires MFA would be sent to set it
  up, though that wouldn't let them in. Replica: on Lucy's say-so, the fake
  answers `scope=all` ahead of the API, with every project and sandbox for a
  superuser and 403 for anyone else; this is the one place it answers ahead
  of the API. The admin collections page's project picker and the admin
  projects list ask for it.
- **A superuser can't delete any project's collection.**
  `DELETE /api/projects/:project_id/collections/:id` needs a project owner
  or admin, with no planned superuser scope, though Lightning's page lets a
  superuser delete any collection. Would need a superuser's token on that
  route. Replica: Delete shows on each row, disabled, with "Not available in
  the API yet".
- **A superuser can't read or change one project they aren't a member of.**
  `GET /api/projects/:id`, `PUT /api/projects/:id` and the member routes
  refuse a superuser who isn't a member, with no planned superuser scope,
  though Lightning's admin projects page and the design both rename any
  project and change its members. Would need a superuser's token on those
  routes. Replica: admin projects has no Edit, and `/settings/projects/:id`
  goes to the list.
- **A superuser can't purge a scheduled project now.** `api/misfits.md`
  leaves immediate purges out on purpose, but Lightning's admin projects page
  has Delete now. Would need a superuser-only purge of a project already
  scheduled for deletion. Replica: Delete now shows in a scheduled project's
  menu, disabled, with "Not available in the API yet".
- **Whether `include=stats` applies to a superuser's list of projects they
  aren't in.** The planned stats are written for your own projects (`role`
  is yours), but the admin projects list's Members column needs
  `collaborators_count` on every project. Would need the stats on
  `scope=all`, with `role` null where you aren't a member. Replica: the
  fake sends them.
- **Whether cancelling a deletion takes a superuser's token.** "Tokens: as
  for deleting the project" doesn't say whether the planned superuser scope
  on deleting carries over to `DELETE /api/projects/:id/scheduled_deletion`.
  Would need it to, for admin projects' Cancel deletion. Replica: the fake
  lets a superuser cancel any project's deletion.

## Admin projects (Lightning's `ProjectLive.Index`, /settings/projects)

- **No code for a new project without exactly one owner.**
  `PUT /api/projects/:id` says "A new project needs exactly one owner" but
  names no code or pointer. Would need one; the member routes use
  `one_owner`. Replica: the fake answers a 422 with a `one_owner` entry at
  `#/members`, and the form shows it under Members.
- **Changed, and that's fine: no sort by owner or member count.** The planned
  `sort` on `GET /api/projects` takes `name`, `inserted_at` and
  `last_activity`. Lightning sorts every column. Replica: Owner and Members
  are plain headers.

## Admin collections (Lightning's `CollectionLive.Index`, /settings/collections)

- **How many items each collection holds.** Brandon's table has an Items
  column (`AdminCollectionTable.tsx`); `GET /api/collections` sends only
  `byte_size_sum`. Would need an `items_count` (or similar) on each
  collection. Replica: column left out.

# API gaps: what the replica needs that api/ doesn't have

One entry per thing the replica needs that `api/` (planned scope included)
can't give: a field Brandon's ia-demo design shows, something Lightning's
own page has, or a hole in the contract itself (a missing error code). Each
says where it shows, what it would need, and what the replica does until
then (usually: leaves it out). The replica's pages map a gap to "none";
they never fake it.

Two lists: what we clearly need from the API, and what the replica does
differently that's fine as it is. Between them, Superuser access: how the
planned superuser scope has to work.

## We clearly need these

The app either guesses, re-does a server rule, or can't tell two answers
apart.

- **Session tokens: no error code for a missing or wrong CSRF token**
  (api/authentication.md, api/errors.md). Writes on a session token need
  `x-csrf-token`, but api/errors.md has no code for one that doesn't match,
  so the only answer left is 403 `forbidden`, which means "you may not do
  this". The app can't tell "your session changed in another tab" from "not
  allowed". Would need a 403 `invalid_csrf_token` in the response codes.
  Replica: the fake server answers `forbidden`, and `client.ts` forgets its
  token on any refused write, so the next one asks for the current token. It
  never resends: the new session may be someone else's.
- **Project access: no error code for a project's MFA requirement**
  (api/projects.md, api/errors.md). A member who hasn't set up MFA gets 403
  `forbidden` from every route on a project that requires it, the same
  answer as a non-member. Lightning sends that member to /mfa_required to
  set it up; the app can't tell the two apart from the answer. Would need a
  403 `mfa_required` on project routes. Replica: `useRefusedForMfa`
  (`src/api/projects.ts`) reads the project list, which holds every project
  you're a member of: a listed project that requires MFA and still refuses
  you is the requirement, so ProjectGate sends you to /mfa_required. It
  leans on `requires_mfa` in the list, which is planned: until Lightning
  sends it, everyone refused sees No Access. It holds only while a
  superuser's list is their own projects (Superuser access, below).
- **Profile: whether a GitHub connection has lapsed** (Lightning's
  `ProfileLive.Edit`). Lightning shows "Reconnect" when the token is there
  but no longer works. `github` on `GET /api/me` has `connected` and
  `expires_at`, but doesn't say what a lapsed token looks like. Would need a
  `status` (`connected`, `expired`, `none`) or a stated rule. Replica: reads
  `connected: false` with an `expires_at` as lapsed, which is a guess.
- **Profile: whether your deletion can go ahead.** Lightning blocks deleting
  an account that is already scheduled and still has project activity. The
  browser works that out from `scheduled_deletion` and
  `has_activity_in_projects` on `GET /api/me`, which re-does a server rule.
  Would need a `deletion_blocked` (or the refusal as a stated 409). Replica:
  the mapper in `src/api/session.ts` works it out.
- **Profile: a superuser scheduling their own deletion.** Lightning refuses
  it (`User.scheduled_deletion_changeset`), but the planned self-deletion in
  `api/users.md` doesn't say how. Would need a stated refusal, such as 403
  `forbidden`. Replica: the fake answers that, and the dialog shows its
  `detail`.
- **Audit trail: say that secrets are left out of `changes`.** We think the
  API leaves them out on purpose: the full-api-test branch drops OAuth
  client secrets and webhook auth usernames, passwords and API keys from
  `changes` (`audit_event_json.ex`), but `api/audit-events.md` names only
  credential bodies. The doc should say so. Replica: shows `changes` as
  sent; no fake event holds one yet.
- **Admin users and projects: Delete now.** Lightning's admin lists let a
  superuser purge a user or project at once. `api/misfits.md` leaves
  immediate purges out on purpose, so a retry can't turn a schedule into
  permanent loss. Would need a superuser-only purge, or a stated decision
  that superusers only schedule. Replica: Delete now stays visible but
  disabled, "Not available in the API yet".
- **Admin collections: delete any collection.** Lightning lets a superuser
  delete any collection; `DELETE /api/projects/:pid/collections/:id` needs
  the project's owner or admin, with no planned superuser scope. Would need
  that scope. Replica: Delete stays visible but disabled, "Not available in
  the API yet".
- **Admin projects: read or edit one project as a superuser.** The planned
  superuser scope covers listing and deleting projects, not reading or
  editing one or its members (`api/projects.md`), though Lightning's admin
  projects page and the design both rename any project and change its
  members. Would need superuser scope on get, update and the member routes.
  Replica: admin projects has no Edit, and `/settings/projects/:id` goes to
  the list.
- **Admin projects: no code for a new project without exactly one owner.**
  `PUT /api/projects/:id` says "A new project needs exactly one owner" but
  names no code or pointer. Would need one; the member routes use
  `one_owner`. Replica: the fake answers a 422 with a `one_owner` entry at
  `#/members`, and the form shows it under Members.
- **Admin users: no error code for removing the last superuser.**
  Lightning lets one save demote or disable the last superuser and lock
  everyone out of admin. `api/users.md` doesn't say the API refuses it.
  Would need a stated refusal, such as 422 on `role` or `disabled`.
  Replica: on your own account Role and Disabled are greyed out, and the
  fake answers that 422.
- **Credentials: editing one secret wipes the others.** The app never sees
  a credential's saved secrets, so when you edit one, it can only send the
  fields you typed. The API replaces the whole set with what it's sent, so
  any field you left blank would be saved blank, and changing only the name
  would be refused. The API needs to keep any field that isn't sent, as it
  already does for an OAuth client's secret. Until then, only the fake does
  that, so this works in the app but not against Lightning yet.
  (`PUT /api/credentials/:id`, `credential_bodies`)
- **Credentials: an external ID can't be saved.** A credential shows its
  external ID, but creating or editing one can't set it. The API needs to
  accept it when saving. Until then the app sends it anyway, and the fake
  accepts it; Lightning would refuse the save. (`external_id` on
  `POST`/`PUT /api/credentials`)
- **Credentials: no way to sign in to an OAuth provider.** An OAuth
  credential gets its token when you sign in to Google, Salesforce and so
  on. The API has no way to start that sign-in or hear how it ended. It
  needs one: start a sign-in and get back the provider's page to open, then
  find out whether it worked. Until then, the Credentials page can't add or
  edit OAuth credentials.
- **Credentials: a refused transfer tells you who has an account.** When
  you hand a credential to someone, the API says either "no such user" or
  "not in these projects", so anyone can find out whether an email has an
  account. It should give one answer for both: "They need an account and a
  role in every project this credential is shared with". Until then, the
  fake gives that one answer. (`not_found` and `no_access` at
  `#/recipient`)
- **Projects: the app has to guess where you may share a credential.**
  Sharing a credential with a project needs editor or above there, but the
  project list doesn't say where you may. The app guesses from your role
  in each project, which PRINCIPLES says it shouldn't. The list needs a
  "can share credentials here" on each project. (`create_project_credential`)
- **Auth provider: "trust unverified emails"** (api/authentication.md,
  Single sign-on provider). Lightning's page and openfn-ia-demo let a
  superuser choose whether an email the provider hasn't marked verified can
  claim an account (`allow_unverified_email`, off by default). The API
  neither sends nor takes it, so the app can't show a provider that trusts
  unverified emails, or turn that off. Would need `allow_unverified_email`
  on GET and PUT. Replica: left out.
- **Channels: a save with `lock_version` for a channel someone deleted.**
  `api/channels.md` says `PUT` creates a channel at a new id, and a
  mismatched `lock_version` is a 409, but not what happens when the version
  is sent for an id that's gone. Creating it again would undo the delete. The
  fake answers 409 `concurrent_edit`.
- **Channels: no stated limit on name and destination URL.** Both are
  `varchar(255)` in Lightning with no validation, and a longer value crashes
  the save (annotation 6.1). `api/channels.md` lists no error for it. Would
  need a 422 at `#/name` and `#/destination_url`. Until then neither the
  form nor the fake checks the length.
- **Sandboxes: which sandboxes the list returns.** `GET
  /api/projects/:id/sandboxes` doesn't say whether it lists only sandboxes
  the caller is a member of. Lightning does (S03), even to the root's
  owner. The fake lists only those.
- **Sandboxes: how many sandboxes a delete or merge takes.** Lightning
  counts every live sandbox below, including ones you can't see (S24, S43).
  The API sends nothing for it, so the warning counts only the listed ones.
  Would need a `descendants_count` (or similar) on each sandbox.
- **Sandboxes: actions on a sandbox you can only reach from below.** Someone
  in only a sandbox has no listing above it they can open, so nothing sends
  its `update_sandbox`, `delete_sandbox` or `merge_sandbox`. Lightning lets
  its admins edit and delete it. The page gives that card no menu.
- **Sandboxes: nesting depth.** Nothing says a project is at the limit before
  you try, and the 422 has no code or pointer. Lightning disables "Create
  Sandbox" with "Maximum sandbox nesting depth reached" (S15). Would need a
  code, and a field on the project or in `limits`.
- **Sandboxes: deleting one takes its sandboxes.** `DELETE /api/projects/:id`
  and the cancel route don't say a sandbox's own sandboxes are scheduled and
  restored with it, as Lightning does. The fake does both.
- **Sandboxes: which project the merge routes take in the path.**
  `…/sandboxes/:id/merge_previews` and `…/merges` sit under a project, but
  api/ doesn't say whether it must be the sandbox's parent. The page sends
  the nearest project above that the viewer can open (the list's
  `parent_id`), which is the parent unless they aren't in it. The fake takes
  any project above.
- **Sandboxes: what an empty `workflow_ids` means in a merge.** api/ says
  it defaults to all when left out, but not what `[]` does. A merge with
  only a "Deleted in sandbox" row ticked sends `[]`; if Lightning reads it
  as "all", that merge would overwrite every workflow. Merge waits for a
  ticked workflow, as Lightning's does.
- **Sandboxes: whether the merge's scheduled deletion worked.** The planned
  scope has the response report it, but doesn't say how. Lightning reports "but could
  not schedule the sandbox for deletion" (S46). The fake always succeeds, and
  the page shows the plain success.
- **Channel requests: a request isn't under its project.**
  `GET /api/channel_requests/:id` is top level, so a member following a
  stale link hears 403, the same as a refusal, and a member of two projects
  gets the other project's request under this one's URL. The detail has no
  `project_id` to check. Would need
  `GET /api/projects/:project_id/channel_requests/:id` (404 to members,
  api/errors.md), or `project_id` on the request. Replica: the page loads
  the project's channels beside the request and shows Not Found when the
  request's channel isn't among them.
- **Channel requests: the detail has no shape** (api/channels.md, Get a
  channel request). It lists the fields in prose, with no JSON example: no
  names for the request, response and timing fields, and nothing on whether
  headers come as pairs or an object. Its `destination_credential.id` is a
  project credential id, where a channel's `destination_credential_id` is a
  credential id. Replica: the fake uses Lightning's column names
  (`query_string`, `body_size`, `latency_us`, …), headers as `[name, value]`
  pairs, and a credential id (not a project credential id) in
  `destination_credential.id`.
- **Channel requests: a reused connection.** Timing has no
  `reused_connection`, so a connect time of 0 can't be told from one that
  wasn't measured. Lightning marks the Connect bar "(reused)". Would need
  the flag in `timing`. Replica: no "(reused)" badge; a zero connect is
  left out of the bar.
- **Dataclips: large integers are rounded** (api/dataclips.md, Get a
  dataclip). `body` comes as a JSON object, so the browser's JSON parser
  rounds integers past 2^53: an id such as 12345678901234567890 shows and
  copies as 12345678901234567000, a value the source never sent.
  Lightning's function already has the body as text (`body_json`). Would
  need the body as a string beside or instead of the object. Replica: shows
  the parsed body, rounded, as Lightning's viewer does today.
- **Dataclips: one that doesn't exist reads No Access.**
  `GET /api/dataclips/:id` is top level, so a member following a stale link
  hears 403, the same as a refusal; the app can't tell "gone" from "not
  yours". `project_id` lets it check the URL's project itself. Would need
  `GET /api/projects/:project_id/dataclips/:id` (404 to members,
  api/errors.md). Replica: No Access for a 403, Not Found when `project_id`
  isn't the URL's project.

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

## Changed, and that's fine

The replica shows less, or shows it another way, and nothing breaks.

- **Auth provider: the redirect host** (api/authentication.md, Single
  sign-on provider). Lightning and openfn-ia-demo let the superuser type the
  host the redirect URI starts with; the API builds `redirect_uri` from the
  instance's `url`. Replica: no field; the URI is built from
  `GET /api/instance`'s `url` and the typed name.

- **Workflows list: Members, who edited each workflow, most recent first**
  (ia-demo `ProjectWorkflowsPage`, `WorkflowRow`; an avatar stack).
  `api/workflows.md` has no editors on a workflow; the only record of who
  changed what is audit events, which aren't on the list route. Would need
  something like `editors` (user ids or names, newest first) on each
  workflow, perhaps under `include=stats`. Replica: column left out.
- **Workflows list: service status (Live / Draft)** on a workflow that backs
  a service. There are no services in the API at all; in ia-demo it sits
  behind the `serviceCatalog` flag. Replica: left out.
- **Workflows list: a description under each workflow's name.** The workflow
  object in `api/workflows.md` has no `description`. Would need a
  `description` field on the workflow, set through create and update.
  Replica: left out.
- **Audit trail: the total** (Lightning's `AuditLive.Index`). Lightning's
  page says "Showing 11 to 20 of 24 total results". `GET /api/audit_events`
  sends links but no `meta`, which runs and work orders have. Would need
  `meta.total_entries`; Lightning's query already counts it
  (`Repo.paginate`). Replica: "Page 2 of 3", the last page from
  `links.last`.
- **Audit trail: the actor as two parts.** Lightning's page puts the email
  under the name. The API joins them into one `actor_display` ("Ada
  Lovelace (ada@example.com)"), though Lightning holds them apart until
  then. Would need `actor_label` and `actor_identifier`. Replica: the string
  on one line, the actor's short id under it.
- **Login: Remember me** ("Keep me logged in for 60 days"; Lightning's own
  login form, not Brandon's design). `POST /api/session` has no
  `remember_me` field, and the session cookie's lifetime is Lightning's to
  set. Would need a `remember_me` boolean on sign in. Replica: checkbox left
  out (docs/lightning-differences.md).
- **Admin collections: how many items each collection holds**
  (Lightning's `CollectionLive.Index`). Brandon's table has an Items column
  (`AdminCollectionTable.tsx`); `GET /api/collections` sends only
  `byte_size_sum`. Would need an `items_count` (or similar) on each
  collection. Replica: column left out.
- **Admin projects: no sort by owner or member count** (Lightning's
  `ProjectLive.Index`). The planned `sort` on `GET /api/projects` takes
  `name`, `inserted_at` and `last_activity`. Lightning sorts every column.
  Replica: Owner and Members are plain headers.
- **Credentials: no warning before unsharing a credential that's in use.**
  Lightning names the workflows that would lose a credential before you
  take a project away from it. The credentials list doesn't say which
  workflows use one; asking takes one extra request per project. Until the
  list says, there's no warning. (`GET /api/workflows?credential_id=…`)
- **Credentials: a pending transfer doesn't say who it's for.**
  openfn-ia-demo shows "Waiting for <email> to accept"; the API only says
  a transfer is pending. Until it sends the email, the row shows "Transfer
  pending" without it.
- **OAuth clients: projects come without names.** A credential lists its
  projects by name; an OAuth client only by id. The app looks the names up
  in the project list, so the OAuth clients table waits for that list too.
- **Channels: openfn-ia-demo's channel fields and channel page.** Its
  channels have a description, a kind (read, write or event), a system, a
  method, an auth summary, an example payload, seven-day traffic, a median
  time and recent messages, shown on a page of their own (`ChannelPage`,
  `ChannelView`). `api/channels.md` has none of them, and Lightning has no
  channel page. The list and form show what the API sends; the form has no
  Description, Kind or System.
- **Sandboxes: openfn-ia-demo's card details.** Who made a sandbox, when it
  was last active and how many workflows it has changed aren't on the
  sandboxes list (owner and `last_activity` come only with `scope=all` or
  `include=stats` on `GET /api/projects`), and a change count would take one
  merge preview per sandbox, which only its admins may ask for. Left out.
- **Sandboxes: where you may merge.** Nothing says which projects the caller
  may merge into. Lightning offers only those where they're an editor or
  above (S33). The dialog offers every live project in the workspace and
  shows the server's refusal.
- **Sandboxes: collections in a merge.** The preview lists no collections and
  a merge can't skip one. Lightning lets you untick them (S42). Every missing
  collection is created.
- **Channel requests: no body hash.** The detail sends no SHA256 of the
  request or response body, so the page has no hash and no "Copy hash".

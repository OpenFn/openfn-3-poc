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
- **Profile and admin users: scheduling a superuser's deletion.** Lightning
  refuses it, your own or another's (`User.scheduled_deletion_changeset`).
  `api/users.md` says Delete a user refuses superusers, but names no answer
  for that, nor for the planned self-deletion. Would need a stated refusal,
  such as 403 `forbidden`. Replica: the fake answers that, and the dialog
  shows its `detail`.
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
- **Admin users: no `can_delete`, with a reason, on a user.** The design's
  users table disables Delete with why ("Superusers can't be deleted", "You
  can't delete your own account"), from a `canDelete` the server decides.
  The user object sends neither, so the app re-does Lightning's rule that
  superusers can't be deleted. Would need `can_delete` with a reason on each
  user in `GET /api/users`. Replica: `canDeleteUser` in `src/permissions.ts`
  works it out, and the page's query puts it on each row.
- **Admin users: no error code for removing the last superuser.**
  Lightning lets one save demote or disable the last superuser and lock
  everyone out of admin. `api/users.md` doesn't say the API refuses it.
  Would need the refusal and its code in `api/users.md` and `errors.md`.
  Replica: the user form greys Role and Disabled on your own account, and
  the fake answers 422 `last_superuser` at `#/role` or `#/disabled`, which
  shows under that field.
- **Admin users: creating a user can't give support access.** `POST
  /api/users` takes no `support_user`, so New user with Support user
  ticked creates the account, then changes it, and a failure in between
  leaves an account without the access asked for. Would need the planned
  `support_user` on Create a user. Replica: two requests; if the second
  fails, the list shows an error toast saying the user was created without
  support access.
- **Admin users: a superuser editing their own account.** `api/users.md`
  doesn't say whether a superuser's own id follows the rules for your own
  account (no change to `role`, `support_user` or `disabled`; email and
  password stepped up, the email confirmed by link) or the superuser scope
  (everything, at once). Would need it stated. Replica: the fake keeps the
  rules for your own account, and the user form greys those fields, with
  email and password left to Profile.

## Superuser access (api/projects.md, api/collections.md, api/users.md)

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
- **Which tokens may create, read, change or delete a user, or cancel a
  deletion.** `api/users.md` plans personal access tokens for managing users
  in general, but Delete a user and Cancel a user's deletion list only the
  service account, and nothing says whether a superuser's session token may
  create, read or change other users, or must be stepped up first. Would
  need a superuser's session token on each, and a stated step-up rule.
  Replica: the fake lets a superuser's session do them all without stepping
  up.

## Changed, and that's fine

The replica shows less, or shows it another way, and nothing breaks.

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
- **Admin users: no Last login** (Lightning's `UserLive.Index`). The
  design's users table shows when each user last signed in; the user object
  has no such field. Would need a `last_login_at` on the user. Replica:
  column left out.
- **Admin users: a new user isn't told.** `api/users.md` says Lightning
  emails nobody it creates; Lightning's admin form sends "Confirm your
  OpenFn account", naming who created it. Would need an option on Create a
  user to send it. Replica: the account is created unconfirmed and nobody is
  emailed.

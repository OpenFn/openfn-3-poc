# API gaps: what the replica needs that api/ doesn't have

One entry per thing the replica needs that `api/` (planned scope included)
can't give: a field Brandon's ia-demo design shows, something Lightning's
own page has, or a hole in the contract itself (a missing error code). Each
says where it shows, what it would need, and what the replica does until
then (usually: leaves it out). The replica's pages map a gap to "none";
they never fake it.

Two lists: what we clearly need from the API, and what the replica does
differently that's fine as it is.

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
  sends it, everyone refused sees No Access. And it breaks once the planned
  superuser scope lists every project: a superuser who isn't a member of an
  MFA project would be sent to set up MFA, though that wouldn't let them in.
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
  editing one (`api/projects.md`). Would need superuser scope on get and
  update. Replica: admin projects has no Edit.
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

- **Confirm account: the lockout sentence leaves out confirming.** api/account.md (Get the
  session) says a `confirmation_required` account gets 401 from every route
  except `POST /api/confirmations`. Lightning's lockout also lets it open and
  submit `/users/confirm/:token` (`confirmation_lockout.ex:18-33`), or a
  locked-out person could never confirm. The contract should list
  `PUT /api/confirmations/:token` too. Replica: confirm-required's fake
  allows it.
- **Confirm account: no way to check a confirm link before pressing.** Lightning checks the
  token when the link is opened (`verify_confirmation_token` on `:edit`). The
  API only refuses on `PUT /api/confirmations/:token`, which uses the link.
  Would need `GET /api/confirmations/:token` answering 204 or 404 without
  using it. Replica: finds out when "Confirm my account" is pressed, and says
  so in the card (docs/lightning-differences.md).
- **Confirm required: when `confirmation_required` starts is unclear.** api/account.md says the
  state means "unconfirmed and the instance requires it", and that routes
  answer 401 "from 48 hours after sign-up". Its implementation note maps it
  to `Accounts.locked_out?/1`, which includes the 48 hours. Read the first
  way, every fresh sign-up would be sent here at once, and a client can't
  tell the grace period from the lockout without `/api/me`, which is locked
  too. The spec should say the state starts at 48 hours. Replica: the fake
  does that.
- **Confirm required: the locked-out 401 has no code of its own.** It answers
  `unauthenticated`, like a signed-out one, so a client has to reload the
  session to tell them apart. Replica: ApiProvider already reloads it on a
  401.
- **First setup: the create isn't sign-up.** api/users.md plans a create without
  a token only "on an instance that allows sign-up", with
  `terms_accepted: true`. Lightning's first setup works with sign-up off and
  asks for no terms. api/account.md says the first account becomes the
  superuser, but not that these conditions are lifted. The spec should say
  so. Replica: the fake lifts both while `needs_setup`.
- **First setup: is the first superuser confirmed?** Sign-up "emails them a confirmation
  link"; Lightning's first setup leaves `confirmed_at` unset and sends
  nothing, so under `require_email_verification` the only administrator is
  locked out after 48 hours. The contract should say which. Replica:
  unconfirmed, nothing sent.
- **First setup: a create can't say "only as first setup".** A first-setup form
  submitted after setup is done becomes an ordinary create (a plain user
  under sign-up, or one made with the new superuser's session). It needs a
  refusal for "already set up". Replica: 401 signed out (with sign-up on,
  a 422 for the missing terms, which the form shows only as "The request
  body is not valid."), 403 signed in, until the admin create defines the
  rest.
- **Register: no code says sign-up is closed.** A signed-out create on an instance
  without sign-up answers 401 `unauthenticated`, the same as "sign in
  first", so a register tab left open after sign-up was turned off can't
  say why. It needs its own code. Replica: 401, shown as sent.
- **Register: the terms refusal isn't specified.** api/users.md asks for
  `terms_accepted: true` but not what a missing or false one answers.
  Replica: a `must_accept` entry at `#/terms_accepted` (api/errors.md lists
  the code), also when the key is left out.
- **Register: a `role` or `confirmed` sent on sign-up.** The contract says sign-up
  gets role `user`, but not whether a sent `role` or `confirmed` is ignored
  or refused. Replica: ignored, as Lightning.
- **Register: starter project.** Lightning's `init_project_for_new_user` makes a
  project and lands the new user on its new-workflow page; the create's
  answer can't say a project was made or where to go. Replica: none, so
  every new user lands on the projects list.

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
- **Reset password: no way to check a reset link before the form**
  (Lightning's `auth-reset-password`). Lightning checks the token when the
  link is opened, without using it up, and refuses a used, expired or
  unknown one at once. The API can only refuse on
  `PUT /api/password_resets/:token`, so the person types a new password
  before learning the link is dead. Would need
  `GET /api/password_resets/:token` answering 204 or 404 without using the
  link. Replica: finds out on submit, then sends the person to ask for a new
  link (docs/lightning-differences.md).
- **Confirm required: no way to correct a mistyped address while locked out.** Lightning's
  page has a "Change email address" form (`request_email_correction/2`); no
  route covers it, and the implementation note says so. A locked-out person
  can't change anything else either, so the replica drops the form and a
  mistyped address needs an administrator.
- **First setup: `needs_setup` hides why setup is closed.** It is false both once a
  superuser exists and when a service account runs the instance, so the
  replica can't show Lightning's "First setup is disabled for this
  instance." 404.

# Misfits

These are methods from the [decoupling design](https://github.com/OpenFn/context/tree/main/lightning/brandon/decoupling-experiment-v2)
that don't belong in this API. That design was for a React client replacing
Lightning's own pages. This API is for clients outside Lightning: scripts,
CLIs, infrastructure automation and other services. They hold a bearer token,
not a browser session, so they need a different set of methods.

Each section names the methods, says why they don't fit, and what to use
instead where there is something. The [register](./register.md) lists every
method and links here.

## Browser sign-in and sessions

`POST /session`, `POST /session/totp`, `DELETE /session`, `POST /session/sudo`,
`POST /session/token_exchange`, `GET /auth/providers`,
`POST /sso/authorizations`, `GET /sso/callback`, `GET /sso/pending-signup`,
`POST /sso/pending-signup/confirm`, `DELETE /sso/pending-signup`.

Signing in with a password, a second factor or an SSO provider makes a browser
session. API clients never sign in: a person creates a personal access token in
the app, and automation trades a signed assertion for a service account token
(see [Authentication](./authentication.md)). The sudo scope is a short re-check
of a person at a keyboard, which a token can't give.

## Self-service account flows

`POST /users`, `POST /password_resets`, `POST /password_resets/:token`,
`POST /me/email_change`, `POST /me/email_change/:token`, `POST /confirmations`,
`POST /confirmations/:token`, `POST /credential_transfers/confirm`.

Each of these is either unauthenticated sign-up or the second half of a link
emailed to a person. The link proves that person controls the inbox, so it has
to be followed by them in a browser, not by a script holding someone's token.

Instead: a service account creates users with `POST /api/users`, and can mark
them confirmed. A credential transfer starts with
`PUT /api/credentials/:id/transfer` and is confirmed from the email.

## First setup

`GET /setup`, `POST /setup/superuser`.

Creating the first superuser happens once, on a new instance, in the browser.
There is no one to issue a token before it, and afterwards the endpoints do
nothing. Infrastructure that needs a superuser at install time should use the
service account and `POST /api/users` with `role: superuser`.

## Account security

`PUT /me/password`, `POST /me/mfa/totp`, `POST /me/mfa/totp/activate`,
`DELETE /me/mfa/totp`, `GET /me/backup_codes`, `POST /me/backup_codes`,
`POST /me/tokens`, `GET /me/identities`, `DELETE /me/identities/:id`,
`POST /webhook_auth_methods/:id/reveal`.

These manage how a person proves who they are, or reveal a secret after
re-checking them. If a personal access token could change the password, turn
off MFA, read backup codes, mint more tokens or unlink a sign-in method, anyone
holding a leaked token could take over the account and keep it after the token
is revoked. They stay in the app, behind a fresh sign-in.

Instead: a person can list and revoke their tokens with `GET /api/me/tokens`
and `DELETE /api/me/tokens/:id`. A webhook auth method's API key is returned
once, when it is created.

## Deleting your own account

`POST /me/deletion`, `DELETE /me/deletion`, `DELETE /me`.

Deleting your own account asks you to type your email to confirm. Scheduling it
disables the account and revokes its tokens, so a token could never cancel it
afterwards. A service account can schedule and cancel a user's deletion with
`DELETE /api/users/:id` and `DELETE /api/users/:id/scheduled_deletion`.

## Consent

`PUT /me/consent`.

Consent is a person's legal choice, made in the app through an extension that
OSS Lightning doesn't include. A token acting on someone's behalf shouldn't
record it for them.

## AI assistant

`GET /projects/:project_id/ai/sessions`, `POST /projects/:project_id/ai/sessions`,
`GET /ai/sessions/:id`, `PATCH /ai/sessions/:id`, `POST /ai/sessions/:id/messages`,
`POST /ai/sessions/:id/messages/:message_id/retry`, `GET /ai/sessions/:id/events`,
`GET /me/ai/disclaimer`, `PUT /me/ai/disclaimer`, `GET /ai/availability`,
`GET /projects/:project_id/ai/usage`.

The assistant is a chat beside the workflow editor. Its replies stream in, it
needs a person to accept a disclaimer before any code or data leaves the
instance, and its answers are applied to the open editor. None of that has a
meaning for a script. If AI features are wanted outside the editor, they should
be designed as their own API rather than borrowed from the chat panel.

## Permission maps and confirm-dialog previews

`GET /me/permissions`, `GET /projects/:id/members/:member_id/removability`,
`GET /projects/:project_id/work_orders/retriable_jobs`,
`GET /sandboxes/:id/merge/targets`.

These exist so a page can grey out buttons and word a confirmation before the
user clicks. This API answers the same questions on the write itself: a 403
`forbidden` when your role doesn't allow it, and a 422 `invalid` naming the
rule that stopped it (for example `one_owner` when removing the owner). Your
role in a project is on [its member list](./projects.md#list-a-projects-members).

## In-process contracts

`authenticate/1`, `authorize/3`, `scope/3`, `assert_elevated/1`.

These are function calls inside the backend, not HTTP routes. Every route here
already authenticates, authorizes and scopes in the
[order of checks](./errors.md#order-of-checks).

## Collaborative editing

`WS JOIN workflow:collaborate/:workflow_id[:vN]`, `WS SEND yjs.sync` /
`yjs.update`, `GET workflow:collaborate/:workflow_id/session`,
`POST workflow:collaborate/:workflow_id/save`,
`POST workflow:collaborate/:workflow_id/save_and_sync`,
`POST workflow:collaborate/:workflow_id/reset`,
`POST workflow:collaborate/:workflow_id/ai_apply_lock` (and its release),
`WS presence`.

The editor shares a live document between the people who have it open, over a
WebSocket. This API is request and response. Outside the editor, read and save
a workflow with the [workflow routes](./workflows.md); a save while someone has
it open answers 409 `being_edited`. To save and sync, update the workflow, then
`POST /api/projects/:project_id/repo_connection/syncs`.

## Live channels

`run:<id>` follow channel.

Following a run as it happens is a WebSocket push for the run page. A client
here polls `GET /api/runs/:id` and `GET /api/log_lines?run_id=…`, and filters
log lines by `timestamp_after` to fetch only new ones.

## Worker protocol

Worker leg of `run:<id>`.

Workers claim and report on runs over their own socket with worker and run
tokens. That protocol is separate from this API and isn't being redesigned.

## Browser downloads

`GET /projects/:project_id/collections/:name/export`.

This sends a whole collection as one file for the browser to save. A client
here streams the same items in batches with `GET /collections/:name` and its
`cursor`, which doesn't hold the whole collection in one response.

## OAuth consent flows

`GET /oauth_clients/:id/authorize_url`, `POST /oauth/callback`,
`GET /credentials/:id/oauth/status`, `POST /me/github-connection/authorize`,
`GET /oauth/github/callback`, `GET /me/github-connection`,
`DELETE /me/github-connection`.

Connecting an OAuth credential, or a person's GitHub account, sends the person
to the provider to grant access and back to Lightning with a code. That needs a
browser and the person. Once a credential is connected, its metadata is on
`GET /api/credentials/:id`. The design's `oauth/status` read also refreshes the
token as a side effect, which a `GET` here shouldn't do.

## GitHub discovery

`GET /github/installations`, `GET /github/installations/:installation_id/repos`,
`GET /github/repos/*repo/branches`.

These pass requests through to GitHub with the person's own GitHub grant, to
fill the pickers in the connect form. A client here already knows the repo and
branch it wants, or can ask GitHub directly. It sends them to
[`PUT /api/projects/:project_id/repo_connection`](./github-sync.md#connect-or-reconnect-a-repo).

## Immediate purges

`DELETE /projects/:id`, `DELETE /admin/projects/:id`, `DELETE /admin/users/:id`.

Deleting a project or user here schedules it, and Lightning removes it after
the instance's retention period. Deleting one that is already scheduled answers
409 `scheduled_for_deletion`, so a retried request can't turn a schedule into
permanent loss. A route that purges at once would undo that guarantee. A purge
stays in the app, behind a typed confirmation.

## Re-parenting a project

The `parent_id` part of `PATCH /admin/projects/:id`.

Moving a project under a new parent turns it into a sandbox, or moves a sandbox
to a different workspace. That changes its environment, who can see it, its
MFA and its merge targets, and nothing checks the new parent for cycles. Create
a sandbox with `PUT /api/projects/:project_id/sandboxes/:id` instead.

## Form helpers

`POST /triggers/cron/preview`, `POST /auth/provider-config/test`.

These check a form's values before it is saved. Here the write does the check:
a workflow with a bad cron expression answers 422 `invalid`, and
[`PUT /api/auth_provider`](./authentication.md#set-the-sign-in-provider)
answers 422 with a `discovery_failed` entry when the provider can't be reached.
[`POST /api/projects/:project_id/workflows/validations`](./workflows.md#validate-a-workflow)
checks a whole workflow without saving it.

## Page-shaped aggregates

`GET /workflows/:id/context`.

This gathers ten things the editor needs when it opens (permissions, limits,
the repo connection, webhook auth methods, instance config) into one response.
It is shaped by one page. Each part has its own route here.

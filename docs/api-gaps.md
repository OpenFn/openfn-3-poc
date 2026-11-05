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

# Account

These routes are for Lightning's own app: signing in and out, and a person
managing their own account. Most of them take only a
[session token](./authentication.md#session-tokens), because they need a person
at the keyboard rather than a script. Managing other people's accounts is in
[Users](./users.md).

A write on a session token needs the session's `x-csrf-token` header. Without
it, or with one that doesn't match, it answers 400 `invalid_header` (see
[session tokens](./authentication.md#session-tokens)).

## Get the instance

Status: **Private**

```
GET /api/instance
```

Tokens: none needed.

What the app needs to know before anyone signs in:

```json
{
  "data": {
    "needs_setup": false,
    "allow_signup": true,
    "url": "https://lightning.example.org",
    "release": { "label": "v2.19.1", "commit": "a1b2c3d", "image_tag": "v2.19.1", "branch": null },
    "admin_email": "support@example.org",
    "purge_deleted_after_days": 7,
    "sign_in_providers": [
      { "name": "keycloak", "kind": "external", "start_url": "https://.../authenticate/keycloak" }
    ],
    "ai_assistant": true,
    "github_sync": true,
    "github_connect_url": "https://github.com/login/oauth/authorize?client_id=…&redirect_uri=…"
  }
}
```

- `needs_setup` is `true` while the instance has no superuser and allows first
  setup. First setup is off whenever a service account is configured. The
  first superuser is then made on the web app's first setup page.
- `sign_in_providers` lists the instance's OpenID Connect provider, if it has
  one (see [Single sign-on provider](./authentication.md#single-sign-on-provider)).
  Its `kind` is always `external`. To sign in with it, send the browser to its
  `start_url`. Lightning sends it on to the provider and back, sets the session
  cookie, and returns to the app.
- `ai_assistant` and `github_sync` say whether the instance has them set up.
- `url` is the instance's own base URL. A sign-in provider's `redirect_uri` is
  built from it.
- `release` is the running build. `label` is the version shown under the logo;
  on an `edge` image Lightning shows `commit` instead. `commit`, `image_tag`
  and `branch` are `null` when the build doesn't set them.
- `admin_email` is the instance's support address, behind the user menu's
  Support link. It is `null` without a signed-in session token.
- `purge_deleted_after_days` is the retention period: how long a project or
  user scheduled for deletion is kept before it is removed. At `0` Lightning
  doesn't run its nightly purge, so nothing scheduled is removed.
- `github_connect_url` is where to send the browser to connect, or reconnect,
  the person's GitHub account for [GitHub sync](./github-sync.md). GitHub
  returns them to Lightning. It is `null` when `github_sync` is `false`.

Planned additional scope: social sign-in providers (`kind: "social"`), and a
`start_url` that links a provider to the account you're signed in to. Today it
only signs in.

## Sessions

### Sign in

Status: **Private**

```
POST /api/session
```

Tokens: none, or a session token to step it up. Only requests from
Lightning's own pages are accepted; any other answers 403 `forbidden`.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required to sign in. |
| `password` | string | Required to sign in, or to step up. |
| `mfa_code` | string | A six-digit code from the person's authenticator. |
| `backup_code` | string | One of their backup codes, used up when it is accepted. Send this or `mfa_code`, not both. |

Signing in replaces any session the request carried. It answers 201 with the
session (as [Get the session](#get-the-session)) and sets the session cookie. If
the account has MFA and no code was sent, it answers 401 `mfa_required` and sets
a session that is only good for sending the code: read its `csrf_token` with
`GET /api/session`, then post again with just `mfa_code` or `backup_code`. Five
wrong codes end that session, and the password has to be entered again.

Signed in, post `password` or `mfa_code` again to step up the session for five
minutes, which a few routes require. It answers 201 with the session. A backup
code can't step up: it is a 422 with a `not_allowed` entry at `#/backup_code`.

Every refused sign-in or step-up answers the same 401 `invalid_credentials`,
whether the email is unknown, the password or code is wrong, or the account is
disabled or scheduled for deletion, so it can't be used to find accounts. An
account with ten failed attempts in 15 minutes answers 429 `too_many_requests`
to every attempt, right or wrong, until the 15 minutes are up.

A password or code sent with no email and no session to continue answers 401
`unauthenticated`. Any other key, a missing `email` or `password`, a value that
isn't a string, or `mfa_code` with `backup_code` is a 422 `invalid`, with
`unknown_key`, `required`, `type` or `exclusive` entries.

### Get the session

Status: **Private**

```
GET /api/session
```

Tokens: session token, in any state.

```json
{
  "data": {
    "state": "signed_in",
    "user_id": "…",
    "stepped_up_until": null,
    "csrf_token": "…",
    "pending_signup": null
  }
}
```

`state` is `signed_in`, `mfa_required` or `confirmation_required`.
`confirmation_required` means the account's email still isn't confirmed and the
instance requires it. From 48 hours after sign-up, every other route answers
401 until the person confirms it. They can still resend the link with
`POST /api/confirmations`. `stepped_up_until` is set only on a `signed_in`
session that has stepped up. `pending_signup` is always `null` for now.

`csrf_token` is the value to send as `x-csrf-token` on writes. Without a
session, it answers 401 `unauthenticated`.

Planned additional scope: a `signup_pending` state for someone who signed in
with a provider for the first time, with `pending_signup` holding the `email`,
`first_name` and `last_name` the provider gave. They would create the account
with `POST /api/users` and `{"from_sign_in": true}`, or sign out to decline.
Today a provider sign-in for an unknown email is refused. The account page's
way to correct a mistyped address while shut out also has no route yet.

### Sign out

Status: **Private**

```
DELETE /api/session
```

Tokens: session token.

Ends the session and hangs up the person's open connections on every device.
Answers 204 with no body, even if there was no session.

## Password resets

### Request a password reset

Status: **Private**

```
POST /api/password_resets
```

Tokens: none needed.

Body: `{"email": "ada@example.com"}`. If an account has the email, Lightning
emails it a link to the reset page. Always answers 202 with no body, so it
can't be used to find accounts. Any other key, or a missing or non-string
`email`, is a 422 `invalid`.

### Reset a password

Status: **Private**

```
PUT /api/password_resets/:token
```

Tokens: none needed.

Body: `{"password": "…"}`, 12 to 72 characters. `:token` is from the emailed
link, which works once, for a day. Revokes every token the person has,
sessions and personal access tokens alike, hangs up their open connections,
and doesn't sign them in. Answers 204 with no body.

A used, expired or unknown token answers 404 `not_found`, before the body is
read. A bad password or any other key is a 422 `invalid`. Two requests with one
token can't both set a password: the loser answers 409 `concurrent_edit`.

## Confirmations

Lightning emails a link to confirm a new account, a new email address, or a
credential transfer. These routes handle all three.

### Resend a confirmation

Status: **Private**

```
POST /api/confirmations
```

Tokens: none, or a session token.

Body: `{"email": "…"}`, or nothing with a session token. Sends the account
confirmation email again. With an email it always answers 202 with no body.

With a session token, including one shut out until the account is confirmed,
it answers 202 when the email is sent, or straight away when the account is
already confirmed. It answers 429 `too_many_requests` after three in 15
minutes, and 503 `service_unavailable` when the email can't be sent.

With neither, it is a 422 with a `required` entry at `#/email`.

### Confirm

Status: **Private**

```
PUT /api/confirmations/:token
```

Tokens: session token of the person the link was sent to, including one shut
out until the account is confirmed.

No body. Confirms what the token is for: the account, the new email address
(which then replaces the old one), or a credential transfer (which then moves
the credential to its recipient). Each token works once. Answers 200 with
`{"data": {"confirmed": "account"}}`, or `email` or `credential_transfer`. A
used, expired or unknown token, or one sent to someone else, answers 404
`not_found`. Without a session it answers 401 `unauthenticated`.

## The current user

### Get the current user

Status: **Private**

```
GET /api/me
```

Tokens: personal access token or session token.

Returns the user the token belongs to, in the same shape as
[`GET /api/users/:id`](./users.md#get-a-user). Use it to check which account a
token is for. A service account token or a GitHub sync token answers 403
`forbidden`, since neither is a person. The projects you are a member of are
`GET /api/projects`.

With a session token, `attributes` also has what the account page shows:

- `mfa_enabled` and `has_password`.
- `inserted_at`, when the account was created, and `confirmed_at`, when its
  email was confirmed, or `null`.
- `contact_preference`: `critical` or `any`, which emails they get.
- `experimental_features`: whether they have turned on experimental features,
  which shows Channels in the project menu and the Channel Logs tab in
  History.
- `has_activity_in_projects`: whether they have started runs, which the
  account deletion dialog mentions.
- `pending_email`: a new address waiting to be confirmed, or `null`.
- `github`: `{"connected", "expires_at"}` for the person's GitHub connection.
- `identities`, `ai_disclaimer_accepted_at` and `consent`, which aren't stored
  yet, so they are always `[]`, `null` and `null`.

Changing these is planned on [`PATCH /api/users/:id`](./users.md#update-a-user)
on your own id.

Planned additional scope: `identities`, the sign-in providers linked to the
account, each `{"id", "provider"}`; `ai_disclaimer_accepted_at`, when they last
accepted the AI assistant's disclaimer, which lasts 24 hours; and `consent`,
their stored choices, on instances with a consent extension.

## Personal access tokens

### List your personal access tokens

Status: **Private**

```
GET /api/me/tokens
```

Tokens: personal access token or session token.

```json
{
  "data": [
    { "id": "…", "token": "eyJhb…xyz12", "inserted_at": "…", "last_used_at": "…" }
  ]
}
```

`token` is masked: only its first and last five characters. Newest first, not
paged. `last_used_at` is `null` for a token never used.

### Create a personal access token

Status: **Private**

```
POST /api/me/tokens
```

Tokens: session token, stepped up.

No body. Answers 201 with the token entry, where `token` is the whole token.
It is never shown again. Any other token answers 403 `forbidden`, and a session
that hasn't stepped up 403 `step_up_required`.

### Revoke a personal access token

Status: **Private**

```
DELETE /api/me/tokens/:id
```

Tokens: personal access token or session token.

Revokes one of your tokens straight away, on every route. A token can revoke
itself, for rotation. Answers 204 with no body. A token that isn't yours
answers 404 `not_found`.

## MFA

Every MFA route takes only a session token. Any other token answers 403
`forbidden`, and a route that needs a stepped-up session answers 403
`step_up_required` without one. A write that races another request turning
MFA off or replacing the backup codes answers 409 `concurrent_edit`.

### Get your MFA settings

Status: **Private**

```
GET /api/me/mfa
```

Tokens: session token. Backup codes need it stepped up.

```json
{ "data": { "enabled": true, "backup_codes": [{ "code": "K7QH2MZPX", "used_at": null }] } }
```

Without a stepped-up session, `backup_codes` is `null`.

### Start setting up MFA

Status: **Private**

```
POST /api/me/mfa
```

Tokens: session token.

No body. Answers 201 with `{"data": {"secret": "…", "otpauth_uri": "otpauth://…"}}`
to show as a QR code. `secret` is base32. Nothing is saved yet.

### Turn on MFA

Status: **Private**

```
PUT /api/me/mfa
```

Tokens: session token, stepped up.

Body: `{"secret": "…", "code": "123456"}`, the secret from starting set-up and
a code from the authenticator. Saves the secret in place of any old one and
answers 200 with the settings, backup codes included. When the person has no
backup codes, it makes ten.

A code that doesn't match answers 422 `invalid` with a `mismatch` entry at
`#/code`. A secret `POST /api/me/mfa` couldn't have given is a `format` entry
at `#/secret`.

### Turn off MFA

Status: **Private**

```
DELETE /api/me/mfa
```

Tokens: session token, stepped up.

Answers 204 with no body, even when MFA was already off. It keeps the backup
codes, so turning MFA on again makes no new ones. A project that requires MFA
turns the person away until they set it up again.

### Make new backup codes

Status: **Private**

```
POST /api/me/mfa/backup_codes
```

Tokens: session token, stepped up.

Replaces every backup code. The old ones stop working at once. Answers 201 with
the settings. Without MFA on, it answers 403 `forbidden`.

## Sign-in providers

Signing in with a provider is done in the browser, through its `start_url`
from [`GET /api/instance`](#get-the-instance).

### Unlink a sign-in provider

Status: **Planned**

```
DELETE /api/me/identities/:id
```

Tokens: session token.

Answers 204 with no body. If it is the last way the person can sign in (no
password and no other provider), answers 422 `invalid` with a `required` entry
at `path` `id`: set a password first.

## GitHub

A person connects their GitHub account in the browser, from the account page,
by following `github_connect_url` from [`GET /api/instance`](#get-the-instance).
Lightning then uses it to set up [GitHub sync](./github-sync.md). Whether it is
connected is `github` on `GET /api/me`.

### Disconnect GitHub

Status: **Private**

```
DELETE /api/me/github_connection
```

Tokens: session token.

Forgets the person's GitHub token and asks GitHub to revoke it. Answers 204
with no body, even if GitHub can't be reached or there was no connection.
Existing repo connections keep working, since they use their own token.

### List your GitHub repos

Status: **Private**

```
GET /api/me/github_repos
```

Tokens: personal access token or session token. Paged, by name.

The repos Lightning's GitHub App can reach through the person's GitHub
account, across all their installations:

```json
{ "data": [{ "full_name": "openfn/malaria-programme", "default_branch": "main", "installation_id": "12345678" }] }
```

An installation whose repos can't be read lists none. A missing or expired
GitHub connection answers 403 `forbidden`; connect it again. When GitHub can't
be reached, it answers 503 `service_unavailable`.

### List a repo's branches

Status: **Private**

```
GET /api/me/github_repos/:owner/:name/branches
```

Tokens: personal access token or session token.

Answers 200 with `{"data": [{"name": "main"}, …]}`, by name. Only the first
page GitHub returns is listed, so a repo with more than 30 branches is cut
short. A repo the person's GitHub account can't reach answers 404 `not_found`.
A missing or expired GitHub connection answers 403 `forbidden`, and 503
`service_unavailable` when GitHub can't be reached.

# Account

These routes are for Lightning's own app: signing in and out, and a person
managing their own account. Most of them take only a
[session token](./authentication.md#session-tokens), because they need a person
at the keyboard rather than a script. Managing other people's accounts is in
[Users](./users.md).

## Get the instance

Status: **Planned**

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
    "sign_in_providers": [
      { "name": "github", "kind": "social", "start_url": "https://.../authenticate/github" },
      { "name": "keycloak", "kind": "external", "start_url": "https://.../authenticate/keycloak" }
    ],
    "ai_assistant": true,
    "github_sync": true
  }
}
```

- `needs_setup` is `true` until the instance has a superuser. While it is, the
  first account made with `POST /api/users` becomes the superuser.
- To sign in with a provider, or link it to the account you're signed in to,
  send the browser to its `start_url`. Lightning sends it on to the provider and
  back, sets the session cookie, and returns to the app.
- `ai_assistant` and `github_sync` say whether the instance has them set up.

## Sessions

### Sign in

Status: **Planned**

```
POST /api/session
```

Tokens: none, or a session token to step it up.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required to sign in. |
| `password` | string | Required to sign in, or to step up. |
| `mfa_code` | string | A six-digit code from the person's authenticator. |
| `backup_code` | string | One of their backup codes, used up when it is accepted. Send this or `mfa_code`. |

Answers 201 with the session and sets the session cookie. If the account has
MFA and no code was sent, answers 401 `mfa_required` and sets a cookie that is
only good for sending the code: post again with just `mfa_code` or
`backup_code`.

Signed in, post `password` or `mfa_code` again to step up the session for five
minutes, which a few routes require. Every refused sign-in answers the same 401
`invalid_credentials`, whether the email is unknown, the password is wrong, or the
account is disabled, so it can't be used to find accounts.

### Get the session

Status: **Planned**

```
GET /api/session
```

Tokens: session token.

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

`state` is `signed_in`, `mfa_required`, or `signup_pending`. `signup_pending`
means someone signed in with a provider for the first time; `pending_signup`
holds the `email`, `first_name` and `last_name` the provider gave. To create the
account, send `POST /api/users` with `{"from_sign_in": true}`. To decline, sign
out.

### Sign out

Status: **Planned**

```
DELETE /api/session
```

Tokens: session token.

Ends the session, drops a pending sign-up, and closes the person's open
connections. Answers 204 with no body, even if there was no session.

## Password resets

### Request a password reset

Status: **Planned**

```
POST /api/password_resets
```

Tokens: none needed.

Body: `{"email": "ada@example.com"}`. If an account has the email, Lightning
emails it a link. Always answers 202 with no body, so it can't be used to find
accounts.

### Reset a password

Status: **Planned**

```
PUT /api/password_resets/:token
```

Tokens: none needed.

Body: `{"password": "…"}`, 12 to 72 characters. `:token` is from the emailed
link, which works once, for a day. Signs the person out everywhere and doesn't
sign them in. Answers 204 with no body. A used or expired token answers 404
`not_found`.

## Confirmations

Lightning emails a link to confirm a new account, a new email address, or a
credential transfer. These routes handle all three.

### Resend a confirmation

Status: **Planned**

```
POST /api/confirmations
```

Tokens: none, or a session token.

Body: `{"email": "…"}`, or nothing when signed in. Sends the account
confirmation email again. Always answers 202 with no body.

### Confirm

Status: **Planned**

```
PUT /api/confirmations/:token
```

Tokens: session token of the person the link was sent to.

No body. Confirms what the token is for: the account, the new email address
(which then replaces the old one), or a credential transfer (which then moves
the credential to its recipient). Each token works once. Answers 200 with
`{"data": {"confirmed": "account"}}`, or `email` or `credential_transfer`. A
used or expired token, or one sent to someone else, answers 404 `not_found`.

## The current user

### Get the current user

Status: **Planned**

```
GET /api/me
```

Tokens: personal access token or session token.

Returns the user the token belongs to, in the same shape as
[`GET /api/users/:id`](./users.md#get-a-user). Use it to check which account a
token is for. A service account token answers 404 `not_found`, since a service
account isn't a user. The projects you are a member of are `GET /api/projects`.

With a session token it adds what the account page shows:

- `mfa_enabled` and `has_password`.
- `pending_email`: a new address waiting to be confirmed, or `null`.
- `identities`: the sign-in providers linked to the account, each
  `{"id", "provider"}`.
- `github`: `{"connected", "expires_at"}` for the person's GitHub connection.
- `ai_disclaimer_accepted_at`: when they last accepted the AI assistant's
  disclaimer. It lasts 24 hours.
- `consent`: their stored choices, on instances with a consent extension.

Changing these is [`PATCH /api/users/:id`](./users.md#update-a-user) on your
own id.

## Personal access tokens

### List your personal access tokens

Status: **Planned**

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

`token` is masked: only its first and last few characters. Not paged.

### Create a personal access token

Status: **Planned**

```
POST /api/me/tokens
```

Tokens: session token, stepped up.

No body. Answers 201 with the token entry, where `token` is the whole token.
It is never shown again.

### Revoke a personal access token

Status: **Planned**

```
DELETE /api/me/tokens/:id
```

Tokens: personal access token or session token.

Revokes one of your tokens straight away, on every route. A token can revoke
itself, for rotation. Answers 204 with no body. A token that isn't yours
answers 404 `not_found`.

## MFA

### Get your MFA settings

Status: **Planned**

```
GET /api/me/mfa
```

Tokens: session token. Backup codes need it stepped up.

```json
{ "data": { "enabled": true, "backup_codes": [{ "code": "4f2a9c1b", "used_at": null }] } }
```

Without a stepped-up session, `backup_codes` is `null`.

### Start setting up MFA

Status: **Planned**

```
POST /api/me/mfa
```

Tokens: session token.

No body. Answers 201 with `{"data": {"secret": "…", "otpauth_uri": "otpauth://…"}}`
to show as a QR code. Nothing is saved yet.

### Turn on MFA

Status: **Planned**

```
PUT /api/me/mfa
```

Tokens: session token.

Body: `{"secret": "…", "code": "123456"}`, the secret from starting set-up and
a code from the authenticator. Answers 200 with the settings. The first time,
it creates ten backup codes and steps the session up so the app can show them.
A code that doesn't match answers 422 `invalid` with a `mismatch` entry at
`#/code`. Sending a new secret replaces the old one.

### Turn off MFA

Status: **Planned**

```
DELETE /api/me/mfa
```

Tokens: session token, stepped up.

Answers 204 with no body. A project that requires MFA turns the person away
until they set it up again.

### Make new backup codes

Status: **Planned**

```
POST /api/me/mfa/backup_codes
```

Tokens: session token, stepped up.

Replaces every backup code. The old ones stop working at once. Answers 201 with
the settings.

## Sign-in providers

Linking a provider is done in the browser, through its `start_url` from
[`GET /api/instance`](#get-the-instance). The linked ones are `identities` on
`GET /api/me`.

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

A person connects their GitHub account in the browser, from the account page.
Lightning then uses it to set up [GitHub sync](./github-sync.md). Whether it is
connected is `github` on `GET /api/me`.

### Disconnect GitHub

Status: **Planned**

```
DELETE /api/me/github_connection
```

Tokens: session token.

Forgets the person's GitHub token and asks GitHub to revoke it. Answers 204
with no body, even if GitHub can't be reached. Existing repo connections keep
working, since they use their own token.

### List your GitHub repos

Status: **Planned**

```
GET /api/me/github_repos
```

Tokens: session token. Paged, by name.

The repos Lightning's GitHub App can reach through the person's GitHub
account, across all their installations:

```json
{ "data": [{ "full_name": "openfn/malaria-programme", "default_branch": "main", "installation_id": "12345678" }] }
```

A missing or expired GitHub connection answers 403 `forbidden`; connect it
again.

### List a repo's branches

Status: **Planned**

```
GET /api/me/github_repos/:owner/:name/branches
```

Tokens: session token.

Answers 200 with `{"data": [{"name": "main"}, …]}`, by name. A repo the
person's GitHub account can't reach answers 404 `not_found`.

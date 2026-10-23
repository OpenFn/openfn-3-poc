# Users

Tokens: service account only. `users:read` for `GET`, `users:write` for `POST`
and `PATCH`. Personal access token support is planned. Access will depend on
the user's instance role: today, only superusers can manage users.

## The user object

```json
{
  "data": {
    "type": "users",
    "id": "604f0cd2-37fb-4833-a5e1-821555b5b314",
    "attributes": {
      "email": "ada@example.com",
      "first_name": "Ada",
      "last_name": "Lovelace",
      "role": "superuser"
    },
    "links": { "self": "https://.../api/users/604f0cd2-…" }
  }
}
```

Planned additional scope: `support_user` (whether they can open projects that
allow support access), `disabled`, and `scheduled_deletion` (a timestamp, or
`null`).

## List users

Status: **Public**

```
GET /api/users
GET /api/users?email=ada@example.com
```

Paged. `email` matches without regard to case. An `email` that isn't a single
string answers 400 `invalid_parameter`.

Planned additional scope: `q`, matching the start of a first name, last name
or email, and `sort`: `email`, `first_name`, `last_name`, `role` or
`scheduled_deletion`, with a `-` prefix for descending.

## Get a user

Status: **Public**

```
GET /api/users/:id
```

## Create a user

Status: **Public**

```
POST /api/users
```

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required. Unique, without regard to case. |
| `password` | string | Required. 12 to 72 characters. |
| `first_name` | string | Required. |
| `last_name` | string | Required. |
| `role` | string | `user` or `superuser`. Defaults to `user`. |
| `confirmed` | boolean | `true` marks the email as already verified. |

Any other key answers 422 with an `unknown_key` entry. Lightning doesn't email
users it creates.

Answers 201 with the user. If the email is already taken and nothing else is
wrong, it answers 409 `taken` with the existing user's id, so a retry is safe:

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "code": "taken",
  "detail": "A value that must be unique is already in use. See errors.",
  "errors": [{ "pointer": "#/email", "code": "taken", "detail": "has already been taken" }],
  "existing": { "id": "604f0cd2-37fb-4833-a5e1-821555b5b314" }
}
```

## Update a user

Status: **Public**

```
PATCH /api/users/:id
```

Takes any of `first_name`, `last_name`, `role`, `password` and `confirmed`.
The email can't be changed: sending `email` or any other key answers 422 with
an `unknown_key` entry. `confirmed` only ever confirms. A new role or password
signs the user out of every browser session. Answers 200 with the user.

Planned additional scope:

- `support_user` and `disabled`. Disabling a user signs them out and revokes
  their access tokens, as deleting does.
- A person can update their own `first_name`, `last_name` and
  `contact_preference` (`critical` or `any`: which emails they get) with a
  personal access token. Nothing else; see [Misfits](./misfits.md#account-security).

## Delete a user

Status: **Private**

```
DELETE /api/users/:id
```

Tokens: service account with `users:write`.

Schedules the user for deletion. The user is disabled, signed out of every
session and their access tokens revoked straight away. They are removed after
the instance's retention period, unless they have created runs, in which case
they stay disabled. Answers 204 with no body.

> Implementation note: `Lightning.Accounts.schedule_user_deletion/2` takes the
> user and their email, which the app asks for as a confirmation. Differences:
> it takes no actor, so it records no audit event, it refuses superusers, and
> it emails the user. The route should pass the user's own email and the
> caller as actor.
> `Lightning.Accounts.delete_user/1` deletes at once, but refuses a user who
> has created runs, so it doesn't suit the API.

## Cancel a user's deletion

Status: **Private**

```
DELETE /api/users/:id/scheduled_deletion
```

Tokens: service account with `users:write`.

Cancels a scheduled deletion and re-enables the user. Answers 200 with the user.
A user who isn't scheduled answers 404 `not_found`.

> Implementation note: `Lightning.Accounts.cancel_scheduled_deletion/1` takes a
> user id. Differences: it takes no actor and records no audit event, raises
> for a missing user, and succeeds for one who isn't scheduled.

## Get the current user

Status: **Planned**

```
GET /api/me
```

Tokens: personal access token.

Returns the user the token belongs to, in the same shape as
`GET /api/users/:id`. Use it to check which account a token is for. A service
account token answers 404 `not_found`, since a service account isn't a user.
The projects you are a member of are `GET /api/projects`.

## List your personal access tokens

Status: **Planned**

```
GET /api/me/tokens
```

Tokens: personal access token.

```json
{
  "data": [
    { "id": "…", "token": "eyJhb…xyz12", "inserted_at": "…", "last_used_at": "…" }
  ]
}
```

`token` is masked: only its first and last few characters. The full token is
shown once, when it is created in the app. Not paged.

## Revoke a personal access token

Status: **Planned**

```
DELETE /api/me/tokens/:id
```

Tokens: personal access token.

Revokes one of your tokens straight away, on every route. A token can revoke
itself, for rotation. Answers 204 with no body. A token that isn't yours
answers 404 `not_found`.

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

## List users

Status: **Public**

```
GET /api/users
GET /api/users?email=ada@example.com
```

Paged. `email` matches without regard to case. An `email` that isn't a single
string answers 400 `invalid_parameter`.

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

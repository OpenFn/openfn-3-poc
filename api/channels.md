# Channels

A channel is a proxy. Lightning forwards requests sent to the channel's URL on
to a destination, adding the destination's credential on the way, and records
each request so it can be looked at later. Channels belong to a project.

## Send a request through a channel

Status: **Public**

```
ANY /channels/:id
ANY /channels/:id/*path
```

Like webhooks, this doesn't use bearer tokens. If the channel has client auth
methods, send one of their API keys in the `x-api-key` header or use HTTP
Basic. With none, the channel is open.

Lightning removes the client's credential, adds the destination's, and
forwards the method, `*path`, query string and body to the channel's
`destination_url`. The destination's response comes back as it is. An
`x-request-id` of 20 to 200 characters is passed through, or Lightning makes
one.

Lightning's own errors are `{"error": "<message>"}`, not problem documents:

- 404 for an unknown or disabled channel, or an id that isn't a UUID.
- 401 when the channel needs credentials and none of its methods match.
- 502 when the destination credential can't be used, for example because it
  has no `main` environment. The request is recorded, and wasn't sent.

## The channel object

```json
{
  "data": {
    "type": "channels",
    "id": "…",
    "attributes": {
      "name": "dhis2-proxy",
      "destination_url": "https://dhis2.example.org/api",
      "enabled": true,
      "lock_version": 3,
      "url": "https://.../channels/…",
      "client_auth_method_ids": ["…"],
      "destination_credential_id": "…",
      "request_count": 1204,
      "last_activity": "…",
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/…/channels/…" }
  }
}
```

- `url` is where clients send requests.
- `client_auth_method_ids` are the project's
  [webhook auth methods](./webhooks.md#webhook-auth-methods) a client must
  pass. Empty means anyone can call the channel.
- `destination_credential_id` is a credential linked to the project, or
  `null`.

## List a project's channels

Status: **Planned**

```
GET /api/projects/:project_id/channels
```

Tokens: personal access token. Paged, by name.

## Get a channel

Status: **Planned**

```
GET /api/projects/:project_id/channels/:id
```

Tokens: personal access token.

## Create or replace a channel

Status: **Planned**

```
PUT /api/projects/:project_id/channels/:id
```

Tokens: personal access token of a project owner, admin or editor.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. |
| `destination_url` | string | Required. An HTTP or HTTPS URL. |
| `enabled` | boolean | Defaults to `true`. |
| `client_auth_method_ids` | array of UUIDs | The full set. Each must be one of the project's webhook auth methods. |
| `destination_credential_id` | UUID or `null` | Must be linked to the project. |
| `lock_version` | integer | Optional. Send the one you read to refuse the write if someone changed the channel since. |

Answers 201 on create and 200 on replace. Each change to the channel's
configuration bumps `lock_version`, and each request records the version it
used.

Notable errors:

- 409 `taken` with an entry at `#/name` when the project has a channel with
  the name.
- 409 `concurrent_edit` when `lock_version` doesn't match.
- 422 `invalid` with a `not_found` entry at
  `#/client_auth_method_ids/N` or `#/destination_credential_id` for an id from
  another project.

Provisioning creates and changes channels too, but can't delete them.

## Delete a channel

Status: **Planned**

```
DELETE /api/projects/:project_id/channels/:id
```

Tokens: personal access token of a project owner, admin or editor.

Deletes the channel and every request recorded for it. Answers 204 with no
body. If a request arrives while it is deleting, answers 409
`concurrent_edit`; send the `DELETE` again.

## List channel requests

Status: **Planned**

```
GET /api/projects/:project_id/channel_requests
GET /api/projects/:project_id/channel_requests?channel_id=:channel_id
```

Tokens: personal access token. Paged, newest first.

```json
{
  "type": "channel_requests",
  "id": "…",
  "attributes": {
    "channel_id": "…",
    "request_id": "…",
    "state": "success",
    "path": "/trackedEntityInstances",
    "error_message": null,
    "started_at": "…",
    "completed_at": "…"
  },
  "relationships": {},
  "links": { "self": "https://.../api/channel_requests/…" }
}
```

`state` is `pending`, `success`, `failed`, `timeout` or `error`.

## Get a channel request

Status: **Planned**

```
GET /api/channel_requests/:id
```

Tokens: personal access token.

Adds to the list entry:

- `channel_snapshot`: the channel's `name`, `destination_url` and
  `lock_version` when the request was made.
- `request` and `response`: method, status, headers and body. Authorization
  headers read `[REDACTED]`. A body that is large or binary is cut to a
  preview, with its full `body_size`.
- `error_category`: `credential` (the request wasn't sent, so it is safe to
  retry), `transport` (no response came back), or `null`.
- `timing`: microseconds spent queuing, connecting, sending, waiting for the
  first byte and receiving.

Under the project's retention policy, the caller's address, headers and bodies
are wiped, and `wiped` is `true`.

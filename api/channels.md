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

Lightning forwards the method, `*path`, query string, body and headers to the
channel's `destination_url`, with these changes to the headers:

- `cookie` and `proxy-authorization` are always removed.
- `x-api-key` is removed when the channel has an API key method, and
  `authorization` when it has a Basic method. The other one passes through:
  a channel with only API key methods forwards the client's `authorization`,
  and an open channel forwards both.
- With a destination credential, `authorization` is set to the credential's
  (Bearer, Basic or ApiToken, by the credential's type), replacing the
  client's.
- `host` is the destination's.
- `x-forwarded-for` gets the client's address added (or is set to it),
  `x-forwarded-host` and `x-forwarded-proto` are set to what the client
  called, and `x-request-id` is set. A client's `x-request-id` of 20 to 200
  characters is kept; otherwise Lightning makes one. It also comes back on
  the response.

The destination's status, headers and body come back as they are, except that
Lightning drops `set-cookie` and sets its own security headers, which the
destination can't override: `content-security-policy` (a `sandbox` policy
with `frame-ancestors 'none'`), `x-content-type-options: nosniff`,
`x-frame-options: DENY` and `referrer-policy: no-referrer`.

Lightning's own errors are [problem documents](./errors.md), and carry the
same security headers:

- 404 `not_found` for an unknown or disabled channel, or an id that isn't a
  UUID.
- 401 `unauthenticated` when the channel needs credentials and none of its
  methods match, whether credentials were sent or not. It challenges with
  `ApiKey header="x-api-key"` when the channel takes an API key, and never
  with Basic.
- 502 `bad_gateway` when the destination credential can't be used, for
  example because it has no values for the project's environment (`main` for
  a project that doesn't set one). The request is recorded, and wasn't sent.
- 500 `internal` when Lightning can't save the channel's snapshot.

A destination that can't be reached answers 502 or 504, and one in a private
network range answers 403 (`CHANNEL_BLOCK_PRIVATE_NETWORKS`, on by default).
Those come from the proxy library, not Lightning's own error codes. Any status
the destination itself answers passes through untouched.

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

The routes below are for people only, on a personal access token or a session
token. The service account is refused 403 `forbidden`.

## List a project's channels

Status: **Private**

```
GET /api/projects/:project_id/channels
```

Tokens: personal access token or session token of any project member. Paged,
by name.

The response's `meta` carries the whole project's totals, whatever page you
asked for: `total_channels` and `total_requests` (every request recorded for
any of the project's channels). They are what the Channels page shows above
the table.

## Get a channel

Status: **Private**

```
GET /api/projects/:project_id/channels/:id
```

Tokens: personal access token or session token of any project member.

## Create or replace a channel

Status: **Private**

```
PUT /api/projects/:project_id/channels/:id
```

Tokens: personal access token or session token of a project owner, admin or
editor.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. |
| `destination_url` | string | Required. An HTTP or HTTPS URL. |
| `enabled` | boolean | Defaults to `true` on create. |
| `client_auth_method_ids` | array of UUIDs | The full set. Each must be one of the project's webhook auth methods. |
| `destination_credential_id` | UUID or `null` | A credential linked to the project. `null` removes it. |
| `lock_version` | integer | Optional. Send the one you read to refuse the write if someone changed the channel since. |
| `id` | UUID | Optional. Must match the path if sent. |

Creates the channel under `:id`, or replaces the project's channel that has
it. A replace that leaves out `enabled`, `client_auth_method_ids` or
`destination_credential_id` keeps what the channel has, so a rename never
opens a channel by dropping its auth methods. Answers 201 on create and 200 on
replace, with the same shape as `GET`. Each change to the channel's
configuration bumps `lock_version`, and each request records the version it
used. Sending what is stored changes nothing and records no audit event.

Notable errors:

- 422 `invalid` with a `taken` entry at `#/name` when the project has a
  channel with the name.
- 422 `invalid` with a `not_found` entry at `#/client_auth_method_ids/N` or
  `#/destination_credential_id` for an id that isn't the project's.
- 409 `concurrent_edit` when `lock_version` doesn't match, or another request
  changes or deletes the channel at the same time.
- 409 `id_taken` when the id belongs to a channel in another project.

Provisioning creates and changes channels too, but can't delete them.

## Delete a channel

Status: **Private**

```
DELETE /api/projects/:project_id/channels/:id
```

Tokens: personal access token or session token of a project owner, admin or
editor.

Deletes the channel and every request recorded for it. Answers 204 with no
body. If a request arrives while it is deleting, answers 409
`concurrent_edit`; send the `DELETE` again.

## List channel requests

Status: **Private**

```
GET /api/projects/:project_id/channel_requests
GET /api/projects/:project_id/channel_requests?channel_id=:channel_id
```

Tokens: personal access token or session token of any project member. Paged,
newest first. A `channel_id` that isn't a UUID answers 400
`invalid_parameter`; one that names no channel in the project lists nothing.

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

Status: **Private**

```
GET /api/channel_requests/:id
```

Tokens: personal access token or session token of any member of the
channel's project. An id that names no request, or isn't a UUID, answers 403
`forbidden`, as for a request you can't see.

Adds to the list entry:

- `client_identity`: the caller's IP address, the first `x-forwarded-for`
  entry or else the connection's address.
- `client_auth`: `type` (`api`, `basic` or `null` when the channel was open),
  and the webhook auth method that matched, as `method_id` and `method_name`.
  `method_name` is `null` when the method has since been deleted.
- `destination_credential`: `id` (a project credential id) and `name`, or
  `null` when the channel had no destination credential. `name` is `null` when
  the credential has since been deleted.
- `channel_snapshot`: the channel's `name`, `destination_url` and
  `lock_version` when the request was made.
- `request`: `method`, `path`, `query_string`, `headers`, `body` and
  `body_size`. `response`: `status`, `headers`, `body` and `body_size`. The
  `authorization`, `x-api-key`, `cookie` and `set-cookie` headers read
  `[REDACTED]`. A body that is large or binary is cut to a preview, with its
  full `body_size`. Either is `null` when nothing was recorded.
- `error_category`: `credential` (the request wasn't sent, so it is safe to
  retry), `transport` (no response came back), or `null`.
- `timing`: microseconds in total (`latency_us`) and spent queuing
  (`queue_us`), connecting (`connect_us`), sending (`request_send_us`),
  waiting for the first byte (`ttfb_us`) and receiving
  (`response_duration_us`).

Under the project's retention policy, the caller's address, path, query
string, headers and bodies are wiped, and `wiped` is `true`.

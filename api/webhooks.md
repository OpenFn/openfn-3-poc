# Webhooks

Webhook triggers start a workflow from an HTTP request. They don't use bearer
tokens. If the trigger has an authentication method set, send its API key in
the `x-api-key` header or use HTTP Basic, as configured. Managing those methods
is [below](#webhook-auth-methods).

## Trigger a workflow

Status: **Public**

```
POST /i/:trigger_id
POST /i/:project_id/:custom_path
```

The body (JSON) becomes the first step's input. Answers depend on the
trigger's `webhook_reply` setting:

- `before_start` (default): 200 `{"work_order_id": "…"}` straight away.
- `after_completion`: waits for the run to finish and answers with its result,
  or 504 `timeout` if it takes too long.
- `custom`: not implemented yet; answers like `before_start`.

Responses carry `x-meta-work-order-id` and, when a run was created,
`x-meta-run-id`.

If the work order is saved but the run isn't started (for example because of
a run limit), the answer carries the `work_order_id` and the reason: a 200 with
an `error` member, or a 429 for an `after_completion` trigger. Don't resend in
that case; the payload is stored.

Errors are problem documents: 401 when the trigger needs credentials and none
were sent, 404 `not_found` for an unknown trigger or wrong credentials, 403
`trigger_disabled`, 413 for a body over the instance's size limit, 415 for a
body Lightning doesn't read, and 429 for any rate or plan limit
(`too_many_runs`, `too_many_requests` or `exceeds_limit`).

## Check a webhook

Status: **Public**

```
GET /i/:trigger_id
GET /i/:project_id/:custom_path
```

Takes the same credentials as `POST`. Answers 200 if the trigger exists, even
if it is disabled:

```json
{ "message": "OpenFn webhook trigger found. Make a POST request to execute this workflow." }
```

## Webhook auth methods

A webhook auth method is a username and password, or an API key, that a
project's webhook triggers and channels can require. It belongs to the project.
Attach it to a trigger with the trigger's `webhook_auth_method_ids` (see
[Workflows](./workflows.md#the-workflow-object)). Passwords are never returned,
and an API key only once.

```json
{
  "data": {
    "type": "webhook_auth_methods",
    "id": "…",
    "attributes": {
      "name": "partner-api",
      "auth_type": "api",
      "username": null,
      "api_key_last_characters": "f00d1",
      "triggers": [{ "id": "…", "workflow_id": "…" }],
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/…/webhook_auth_methods/…" }
  }
}
```

`auth_type` is `basic` or `api`. `username` is set for `basic`.

### List a project's webhook auth methods

Status: **Planned**

```
GET /api/projects/:project_id/webhook_auth_methods
```

Tokens: personal access token. Paged. Methods scheduled for deletion are left
out.

### Get a webhook auth method

Status: **Planned**

```
GET /api/projects/:project_id/webhook_auth_methods/:id
```

Tokens: personal access token of a project owner or admin.

### Create or replace a webhook auth method

Status: **Planned**

```
PUT /api/projects/:project_id/webhook_auth_methods/:id
```

Tokens: personal access token of a project owner or admin.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. |
| `auth_type` | string | Required on create, and can't change. `basic` or `api`. |
| `username` | string | Required for `basic` on create, and can't change. |
| `password` | string | Required for `basic` on create. 8 to 72 characters. Leave it out of a replace to keep it. |

For `api`, Lightning generates the key. Answers 201 on create and 200 on
replace. The 201 for an `api` method is the only response that carries the
whole key, as `api_key`. Store it then.

### Delete a webhook auth method

Status: **Planned**

```
DELETE /api/projects/:project_id/webhook_auth_methods/:id
```

Tokens: personal access token of a project owner or admin.

Schedules the method for deletion. Lightning detaches it from its triggers and
deletes it after the instance's retention period. Answers 204 with no body.
Deleting one that is already scheduled answers 409 `scheduled_for_deletion`.

# Webhooks

Webhook triggers start a workflow from an HTTP request. They don't use bearer
tokens. If the trigger has an authentication method set, send its API key in
the `x-api-key` header or use HTTP Basic, as configured.

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

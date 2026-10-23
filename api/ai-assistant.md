# AI assistant

The AI assistant is a chat beside the workflow editor. It helps write a job's
code, or a whole workflow. A chat belongs to a project, and everyone in the
project can read it. These routes take only a
[session token](./authentication.md#session-tokens), since a person has to
accept the assistant's disclaimer before anything is sent to it.

Whether the instance has the assistant is `ai_assistant` on
[`GET /api/instance`](./account.md#get-the-instance). Whether the project has
used up its allowance is `limits` on
[`GET /api/projects/:id`](./projects.md#get-a-project). Accepting the
disclaimer is `ai_disclaimer_accepted` on
[`PATCH /api/users/:id`](./users.md#update-a-user), for your own id.

## The session object

```json
{
  "data": {
    "type": "ai_sessions",
    "id": "…",
    "attributes": {
      "title": "Map patients to FHIR",
      "kind": "job_code",
      "job_id": "…",
      "workflow_id": null,
      "message_count": 4,
      "messages": [
        {
          "id": "…",
          "role": "assistant",
          "content": "…",
          "code": "fn(state => …)",
          "status": "success",
          "inserted_at": "…"
        }
      ],
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/ai_sessions/…" }
  }
}
```

- `kind` is `job_code` (about one job) or `workflow` (about the whole
  workflow).
- A message's `code` is code the assistant suggests, for the editor to apply.
- `status` is `pending` while the assistant is answering, then `success` or
  `error`. Lists leave `messages` out.

## List a project's AI sessions

Status: **Planned**

```
GET /api/projects/:project_id/ai_sessions?job_id=:job_id
GET /api/projects/:project_id/ai_sessions?workflow_id=:workflow_id
```

Tokens: session token. Paged, newest first. Send `job_id` or `workflow_id`.

## Start an AI session

Status: **Planned**

```
POST /api/projects/:project_id/ai_sessions
```

Tokens: session token.

Send `kind`, `job_id` or `workflow_id`, and the first `message` (see sending a
message, below). Answers 201 with the session, its first message `pending`.

## Get an AI session

Status: **Planned**

```
GET /api/ai_sessions/:id
```

Tokens: session token.

Returns the session with its messages, oldest first. While the newest message
is `pending`, fetch it again to see the answer.

## Send a message

Status: **Planned**

```
POST /api/ai_sessions/:id/messages
```

Tokens: session token.

| Field | Type | Notes |
| --- | --- | --- |
| `content` | string | Required. 1 to 10,000 characters. |
| `context` | object | The job as it is in the editor now, saved or not: `name`, `body`, `adaptor`. Lightning uses what it has saved if this is left out. |
| `attach` | object | What else to send the assistant: `code`, `logs` and `io` (a step's input and output), each `false` unless set. `io` and `logs` take a `step_id` or `run_id` from the project. |

Nothing is sent to the assistant that wasn't asked for, and secrets are removed
from step data first. Answers 201 with the message, `pending`.

Notable errors:

- 422 `invalid` with a `must_accept` entry when the disclaimer hasn't been
  accepted in the last 24 hours.
- 402 `exceeds_limit` when the project has used its allowance.
- 404 `not_found` for a `step_id` or `run_id` from another project.

## Retry a message

Status: **Planned**

```
POST /api/ai_sessions/:id/messages/:message_id/retries
```

Tokens: session token.

No body. Asks again with what the message sent the first time. Answers 201 with
the message, `pending`. Limits are checked again.

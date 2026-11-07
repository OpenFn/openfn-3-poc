# AI assistant

The AI assistant is a chat beside the workflow editor. It helps write a job's
code, or a whole workflow. A chat belongs to a project, and everyone in the
project can read it. These routes take only a
[session token](./authentication.md#session-tokens), since a person has to
accept the assistant's disclaimer before anything is sent to it. Any other
token is refused 403 `forbidden`. Any project member may read and chat,
viewers included.

Whether the instance has the assistant is `ai_assistant` on
[`GET /api/instance`](./account.md#get-the-instance). Whether the project has
used up its allowance is `limits` on
[`GET /api/projects/:id`](./projects.md#get-a-project).

Planned additional scope: refusing a message with 422 `invalid` and a
`must_accept` entry when the person hasn't accepted the disclaimer in the last
24 hours, and recording that they have with `ai_disclaimer_accepted` on
[`PATCH /api/users/:id`](./users.md#update-a-user). Lightning doesn't check
the disclaimer today: it is a footer in the browser, and Lightning keeps no
record of a person accepting it.

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
- `job_id` and `workflow_id` can name a job or workflow not yet saved, as the
  editor names one before its first save. A `workflow` session can have
  neither.
- A message's `code` is code the assistant suggests, for the editor to apply.
- `status` is `pending` while the message waits its turn, `processing` while
  the assistant answers, then `success` or `error`. Lists leave `messages`
  out. Cancelled messages are left out, and not counted in `message_count`.

An unknown session id, or one that isn't a UUID, answers 403 `forbidden`, as
for a session you can't see.

## The message object

Sending and retrying a message answer with the message on its own:

```json
{
  "data": {
    "type": "ai_messages",
    "id": "…",
    "attributes": {
      "id": "…",
      "role": "user",
      "content": "And now?",
      "code": null,
      "status": "pending",
      "inserted_at": "…"
    },
    "relationships": {
      "session": { "data": { "type": "ai_sessions", "id": "…" } }
    },
    "links": { "session": "https://.../api/ai_sessions/…" }
  }
}
```

## List a project's AI sessions

Status: **Private**

```
GET /api/projects/:project_id/ai_sessions?job_id=:job_id
GET /api/projects/:project_id/ai_sessions?workflow_id=:workflow_id
```

Tokens: session token. Paged, newest activity first (by `updated_at`). Send
one of `job_id` or `workflow_id`. `job_id` lists the sessions about the job,
saved or not yet saved; `workflow_id` lists the `workflow` sessions about the
workflow. An id from another project lists nothing.

Sending neither, both, or an id that isn't a UUID answers 400
`invalid_parameter`.

## Start an AI session

Status: **Private**

```
POST /api/projects/:project_id/ai_sessions
```

Tokens: session token.

| Field | Type | Notes |
| --- | --- | --- |
| `kind` | string | Required. `job_code` or `workflow`. |
| `job_id` | UUID | Required for `job_code`. Not allowed for `workflow`. |
| `workflow_id` | UUID | For `job_code`, the job's workflow: required for a job not yet saved, and must match a saved job's. For `workflow`, optional. |
| `message` | object | Required. The first message, as in [sending a message](#send-a-message). |

A `job_id` that names no job in the project is a job not yet saved. It needs a
`workflow_id` of a saved workflow in the project, and a `name` in the
message's `context`. A `workflow_id` that names no workflow in the project, for
a `workflow` session, is a workflow not yet saved.

Answers 201 with the session, its first message `pending`.

Notable errors:

- 422 `invalid` with every problem in the body at once, at its key: `required`
  for a missing field, `not_allowed` for a `job_id` on a `workflow` session,
  `mismatch` at `#/workflow_id` when it isn't a saved job's workflow,
  `not_found` at `#/workflow_id` for an unsaved job's workflow outside the
  project, and the message's entries under `#/message`.
- 402 `exceeds_limit` when the project has used its allowance. A body that is
  also invalid answers 422 instead.

## Get an AI session

Status: **Private**

```
GET /api/ai_sessions/:id
```

Tokens: session token.

Returns the session with its messages, oldest first. While the newest message
is `pending`, fetch it again to see the answer.

## Send a message

Status: **Private**

```
POST /api/ai_sessions/:id/messages
```

Tokens: session token.

| Field | Type | Notes |
| --- | --- | --- |
| `content` | string | Required. 1 to 10,000 characters. |
| `context` | object | The job as it is in the editor now, saved or not: `name`, `body`, `adaptor`, each a string. Lightning uses what it has saved if this is left out. Not allowed on a `workflow` session. |
| `attach` | object | What else to send the assistant: `code`, `logs` and `io` (a step's input and output), each `false` unless set. `logs` needs a `run_id`, and `io` a `step_id`, from the project. A `workflow` session takes only `code`. |

Nothing is sent to the assistant that wasn't asked for, and secrets are removed
from step data first. Each message keeps its own context and attachments.
Answers 201 with the [message](#the-message-object), `pending`.

Notable errors:

- 422 `invalid` with every problem in the body at once, at its key: for
  example `too_long` at `#/content`, `required` at `#/attach/run_id`,
  `not_supported` at `#/context` or `#/attach/logs` on a `workflow` session,
  and `unknown_key` for any other key.
- 422 `invalid` with a `not_found` entry at `#/attach/step_id` or
  `#/attach/run_id` for a step or run from another project.
- 402 `exceeds_limit` when the project has used its allowance. A body that is
  also invalid answers 422 instead.
- 409 `concurrent_edit` when the session is deleted at the same time.

## Retry a message

Status: **Private**

```
POST /api/ai_sessions/:id/messages/:message_id/retries
```

Tokens: session token.

No body, or an empty object. Asks again with what the message sent the first
time. Only a person's message whose status is `error` can be retried. Answers
201 with the [message](#the-message-object), `pending`. Limits are checked
again.

Notable errors:

- 404 `not_found` for a message that isn't in the session, or was cancelled.
- 409 `not_retryable` for a message that hasn't failed, or is the
  assistant's.
- 422 `invalid` with an `unknown_key` entry for any key in the body.
- 402 `exceeds_limit` when the project has used its allowance. The message
  stays `error`.
- 409 `concurrent_edit` when another request retries it at the same time.

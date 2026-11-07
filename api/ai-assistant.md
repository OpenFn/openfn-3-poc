# AI assistant

The AI assistant is a chat beside the workflow editor. It helps write a job's
code, or a whole workflow. A chat belongs to a project, and everyone in the
project can read it. The `/api/ai_sessions` routes take only a
[session token](./authentication.md#session-tokens), since a person has to
accept the assistant's disclaimer before anything is sent to it. Lightning's
web app lists sessions today through its own route,
[`GET /api/ai_assistant/sessions`](#list-ai-sessions-in-the-web-app).

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
- `status` is `pending` while the message waits its turn, `processing` while
  the assistant answers, then `success` or `error`. Lists leave `messages`
  out.

## List AI sessions in the web app

Status: **Public**

```
GET /api/ai_assistant/sessions?session_type=job_code&job_id=:job_id
GET /api/ai_assistant/sessions?session_type=workflow_template&project_id=:project_id
GET /api/ai_assistant/sessions?session_type=workflow_template&project_id=:project_id&workflow_id=:workflow_id
```

Tokens: the web app's session. This route serves only Lightning's own web
app: it takes the web app's session cookie, not a bearer token. A request
without a signed-in session answers 401 `unauthenticated`.

| Parameter | Notes |
| --- | --- |
| `session_type` | Required. `job_code` or `workflow_template`, Lightning's two kinds of session. |
| `job_id` | Required with `job_code`. A saved job's id, or the id of a job not saved yet. |
| `project_id` | Required with `workflow_template`. |
| `workflow_id` | Optional, with `workflow_template`. Lists only the sessions about this workflow. Left out, or naming no saved workflow, it lists the project's sessions about no workflow. |
| `offset` | Default 0. |
| `limit` | Default 20. |

Newest first by `updated_at`.

```json
{
  "sessions": [
    {
      "id": "…",
      "title": "Map patients to FHIR",
      "session_type": "workflow_template",
      "message_count": 4,
      "updated_at": "…",
      "project_name": "malaria-programme",
      "workflow_name": "Data processing pipeline"
    }
  ],
  "pagination": { "total_count": 12, "has_next_page": true, "has_prev_page": false }
}
```

A `job_code` session has `job_name` and `workflow_name` instead, and
`is_unsaved: true` when its job isn't saved yet. A deleted job's name is
`[Deleted Job]`.

With `project_id`, any project member can list, viewers included, and so can a
support user where the project allows support access. A project the caller
can't access answers 403 `forbidden`, whether or not it exists, and is checked
before the other parameters. Only superusers hear 404 for an unknown project,
or 400 for an id that isn't a UUID. A project scheduled for deletion answers
409 `scheduled_for_deletion`.

A `job_id` is a filter, not a target. A job the caller can't see, or someone
else's session about an unsaved job in no workflow, lists nothing, as an
unknown job does. Only a `job_id` that isn't a UUID answers 400
`invalid_parameter`. Every bad parameter is reported together in one 400
`invalid_parameter`.

## List a project's AI sessions

Status: **Private**

```
GET /api/projects/:project_id/ai_sessions?job_id=:job_id
GET /api/projects/:project_id/ai_sessions?workflow_id=:workflow_id
```

Tokens: session token. Paged, newest first. Send `job_id` or `workflow_id`.

> Implementation note: `Lightning.AiAssistant.list_sessions/3`, which the web
> app reaches through the live route
> [`GET /api/ai_assistant/sessions`](#list-ai-sessions-in-the-web-app)
> (`LightningWeb.API.AiAssistantController.list_sessions/2`). Differences:
>
> - the live route has no project in the path. It takes `session_type` with
>   `job_id`, or `project_id` and an optional `workflow_id`, pages with
>   `offset` and `limit`, and answers in its own shape.
> - its `job_id` lists by job alone, and nothing checks the job is in a given
>   project. It also matches sessions for a job not yet saved, by the id in
>   `meta`.
> - its `workflow_id`, left out or naming no saved workflow, lists the
>   project's sessions that have no workflow, instead of all of them or none,
>   since the controller always passes a `workflow:` option.
> - with `project_id`, it checks the project with
>   `LightningWeb.API.Target.project/3` and `:access_project` (standing, and
>   MFA where the project requires it).

## Start an AI session

Status: **Private**

```
POST /api/projects/:project_id/ai_sessions
```

Tokens: session token.

Send `kind`, `job_id` or `workflow_id`, and the first `message` (see sending a
message, below). Answers 201 with the session, its first message `pending`.

> Implementation note: `Lightning.AiAssistant.create_workflow_session/6`, and
> `Lightning.AiAssistant.create_session_for_unsaved_job/3` for a job not yet
> saved. The app reaches them by joining the channel topic
> `ai_assistant:<type>:new` (`LightningWeb.AiAssistantChannel`). Both save the
> first message `pending` and queue it. Differences:
>
> - the channel makes a session about a saved job a `workflow_template`
>   session with the job on its first message. Only an unsaved job gets a
>   `job_code` session. `create_session/4` makes a `job_code` one but nothing
>   in the app calls it. Lightning's kinds are `job_code` and
>   `workflow_template`, not `workflow`.
> - no quota check: `Lightning.AiAssistant.Limiter.validate_quota/1` runs on
>   later messages, not the first, so a new session spends allowance freely.
> - the context functions do no authorisation. The channel checks project
>   membership and that a named workflow is the user's to write
>   (`:access_write`, which also only checks membership).

## Get an AI session

Status: **Private**

```
GET /api/ai_sessions/:id
```

Tokens: session token.

Returns the session with its messages, oldest first. While the newest message
is `pending`, fetch it again to see the answer.

> Implementation note: `Lightning.AiAssistant.get_session/1`, which preloads
> the messages oldest first and leaves out `cancelled` ones. The app reaches it
> by joining `ai_assistant:<type>:<id>`. Differences: it does no authorisation.
> The channel does (any project member may read; a session with no job,
> workflow or project left is its owner's only), and the route has to repeat
> it. The session has no `message_count` here; only lists fill it.

## Send a message

Status: **Private**

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
- 422 `invalid` with a `not_found` entry for a `step_id` or `run_id` from
  another project.

> Implementation note: `Lightning.AiAssistant.save_message/3` saves the
> message and queues `Lightning.AiAssistant.MessageProcessor` in one
> transaction. The app sends the channel's `new_message` frame, which checks
> the quota with `Lightning.AiAssistant.Limiter.validate_quota/1` first.
> Differences:
>
> - over the allowance it still saves the message, with status `error`, and
>   answers success with the limit text, rather than refusing with 402.
> - nothing on the server checks the disclaimer. It is a footer in the
>   browser, so there is no `must_accept` to return yet.
> - attachments are the frame's `attach_logs`, `attach_io_data`, `step_id`
>   and `follow_run_id`. They are stored on the session, not the message, so
>   each message replaces the last one's. A run or step from another project
>   is dropped silently, not refused.
> - an unsaved job travels in the frame; a saved job's editor text comes from
>   the separate `update_context` frame, which needs edit rights. Without it
>   the saved job is used.
> - any project member may send, viewers included (the channel's `:read`
>   check), and the function itself checks nothing.

## Retry a message

Status: **Private**

```
POST /api/ai_sessions/:id/messages/:message_id/retries
```

Tokens: session token.

No body. Asks again with what the message sent the first time. Answers 201 with
the message, `pending`. Limits are checked again.

> Implementation note: `Lightning.AiAssistant.retry_message/1` sets the
> message back to `pending` and queues it again. The app sends the channel's
> `retry_message` frame, which checks the message is in the session and the
> quota (refusing over the limit), with the same `:read` check as sending.
> Differences: the function takes a loaded message, checks nothing itself and
> accepts a message in any status or role. It sends the session's current
> attachments and context, not what the message sent the first time.

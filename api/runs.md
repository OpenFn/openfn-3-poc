# Runs

## List and get runs

Status: **Public**

Tokens: personal access token, or service account with `projects:write`. Read
only.

```
GET /api/runs
GET /api/runs?project_id=:project_id
GET /api/projects/:project_id/runs
GET /api/runs/:id
GET /api/projects/:project_id/runs/:id
```

On the nested route, a run that isn't in the path's project answers 404 to a
caller who can access the project. On `/api/runs/:id`, an unknown or malformed
id answers 403 `forbidden`, except to the service account, which hears 404 or
400. See [who hears 404](./errors.md#who-hears-404).

Lists are paged, newest first by `inserted_at`, and take these filters:

| Parameter | Notes |
| --- | --- |
| `workflow_id`, `work_order_id` | UUIDs. |
| `state` | Comma-separated: `available`, `claimed`, `started`, `success`, `failed`, `crashed`, `cancelled`, `killed`, `exception`, `lost`. |
| `inserted_after`, `inserted_before` | ISO 8601. |
| `updated_after`, `updated_before` | ISO 8601. |

Every bad filter is reported together in one 400 `invalid_parameter`. The
service account must send `project_id`, in the path or the query; without it
the answer is 400 `invalid_parameter` with a `required` entry. A `project_id`
you may not access answers 403 `forbidden`, whether or not the project exists,
and is checked before the other filters. Only superusers and the service
account hear 404 for an unknown `project_id`, or 400 for one that isn't a UUID.

Each run (`priority` is `immediate` or `normal`):

```json
{
  "type": "runs",
  "id": "…",
  "attributes": {
    "state": "failed",
    "started_at": "…",
    "finished_at": "…",
    "priority": "normal",
    "error_type": "RuntimeCrash"
  },
  "relationships": {},
  "links": { "self": "https://.../api/runs/…" }
}
```

Planned additional scope:

- `inserted_at`, when the run was queued. The `inserted_after` and
  `inserted_before` filters already use it.
- The ids the run points at: `work_order_id`, `starting_job_id` or
  `starting_trigger_id` (where it started), `created_by_id` (the user who
  started or retried it, or `null` for a trigger) and `snapshot_id` (the
  workflow version it ran).
- `snapshot_lock_version`, so a client can tell a run on the latest version of
  its workflow from one on an older version.
- `created_by_email` and `starting_trigger_type` (`webhook` or `cron`), what
  the run page shows under "Started by".

## Cancel a run

Status: **Private**

```
PATCH /api/runs/:id
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Body: `{"state": "cancelled"}`. No other field or state is accepted. Answers
200 with the run. An unknown or malformed id answers 403 `forbidden`.

Only a run that hasn't been claimed by a worker yet (state `available`) can be
cancelled. Any other run, or another `state`, answers 422 `invalid` with a
`not_allowed` entry at `#/state`. A run a worker claims while it is being
cancelled answers 409 `concurrent_edit`.

Planned additional scope: recording who cancelled the run in an audit event.

## Retry a run

Status: **Private**

```
POST /api/runs/:id/retries
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

| Field | Type | Notes |
| --- | --- | --- |
| `step_id` | UUID | Required. The step to retry from. It must belong to this run. |

Creates a new run on the same work order, starting from that step. Steps that
don't depend on it are carried over rather than run again. Answers 201 with the
new run, in the same shape as `GET /api/runs/:id`.

Notable errors:

- 409 `not_retryable` when the run's workflow has been deleted, before the
  body is read, and 409 `concurrent_edit` when it is deleted during the retry.
- 422 `invalid` with a `required` entry at `#/step_id` when it is missing, and
  a `not_found` entry when the step isn't in this run.
- 422 `invalid` with a `dataclip_wiped` entry at `#/step_id` when the step's
  input has been wiped.
- 429 `too_many_runs` or 402 `exceeds_limit` for run limits, checked once the
  body is valid.

Planned additional scope: `step_id` becomes optional. Without it, the run is
retried from the start of its workflow, with the same input.

## List a run's steps

Status: **Private**

```
GET /api/runs/:id/steps
GET /api/runs/:id/steps?job_id=:job_id
```

Tokens: as for getting a run, so the service account with `projects:write` may
read them too.

```json
{
  "data": [
    {
      "type": "steps",
      "id": "…",
      "attributes": {
        "job_id": "…",
        "exit_reason": "success",
        "error_type": null,
        "started_at": "…",
        "finished_at": "…",
        "input_dataclip_id": "…",
        "output_dataclip_id": "…"
      },
      "relationships": {},
      "links": {}
    }
  ],
  "included": [],
  "links": { "self": "…" }
}
```

Steps are in the order they ran. Not paged. An unknown or malformed run id
answers as for `GET /api/runs/:id`. A `job_id` that isn't a UUID answers 400
`invalid_parameter`.

Planned additional scope: `job_name` and `adaptor` on each step, read from the
snapshot the step ran on, so a step can be labelled after its job is renamed or
deleted.

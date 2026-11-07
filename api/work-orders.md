# Work orders

## List and get work orders

Status: **Public**

Tokens: personal access token, or service account with `projects:write`. Read
only.

```
GET /api/work_orders
GET /api/work_orders?project_id=:project_id
GET /api/projects/:project_id/work_orders
GET /api/work_orders/:id
GET /api/projects/:project_id/work_orders/:id
```

Lists are paged and take these filters:

| Parameter | Notes |
| --- | --- |
| `id` | Comma-separated work order ids. |
| `workflow_id` | UUID. |
| `state` | Comma-separated: `rejected`, `pending`, `running`, `success`, `failed`, `crashed`, `cancelled`, `killed`, `exception`, `lost`. These are work order states, not run states: the History page labels `pending` "Enqueued". |
| `inserted_after`, `inserted_before` | ISO 8601. |
| `updated_after`, `updated_before` | ISO 8601, on `updated_at`. A run changing state moves the work order's `last_activity` but not its `updated_at`, so these don't filter by activity. |

Every bad filter is reported together in one 400 `invalid_parameter`. The
service account must send `project_id`, in the path or the query; without it
the answer is 400 `invalid_parameter` with a `required` entry. A `project_id`
you may not access answers 403 `forbidden`, whether or not the project exists,
and is checked before the other filters. Only superusers and the service
account hear 404 for an unknown `project_id`, or 400 for one that isn't a UUID.
Lists are ordered by `last_activity`, newest first.

On the nested route, a work order that isn't in the path's project answers 404
to a caller who can access the project. On `/api/work_orders/:id`, an unknown or
malformed id answers 403 `forbidden`, except to the service account, which
hears 404 or 400. See [who hears 404](./errors.md#who-hears-404).

Each work order:

```json
{
  "type": "work_orders",
  "id": "…",
  "attributes": { "state": "success", "last_activity": "…", "inserted_at": "…", "updated_at": "…" },
  "relationships": {},
  "links": { "self": "https://.../api/work_orders/…" }
}
```

Planned additional scope:

- `workflow_id`, `dataclip_id` (the input) and `dataclip_wiped` (`true` once
  the input's body has been wiped) in each work order's attributes.
- `last_activity_after`, `last_activity_before`: ISO 8601, on `last_activity`.
  The History page's default is the last 30 days.
- `search`: text to find in work orders, with `search_fields`, a
  comma-separated choice of `id`, `dataclip_name`, `body` (the input) and `log`.
  Defaults to all four. `id` matches part of the work order's, its runs' or
  their steps' ids, not dataclip ids. `dataclip_name` matches part of the
  input's name. `body` and `log` match words starting with the text in the
  steps' inputs and the runs' log lines. A search counts at most 50 matches,
  and `meta` says when it stopped counting.
- `sort`: `inserted_at` or `last_activity`, with a `-` prefix for descending.
  Defaults to `-last_activity`.
- `include=runs`: adds each work order's runs, in the same shape as
  `GET /api/runs/:id`, newest first.

## Run a workflow

Status: **Private**

```
POST /api/projects/:project_id/workflows/:workflow_id/work_orders
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Starts a work order by hand, the way the app's Run button does.

| Field | Type | Notes |
| --- | --- | --- |
| `job_id` | UUID | The job to start from. Send this or `trigger_id`. |
| `trigger_id` | UUID | Start from the job this trigger leads to. |
| `dataclip_id` | UUID | Optional. An existing input from this project to reuse. |
| `body` | object | Optional. A new input. Send this or `dataclip_id`, not both. Defaults to `{}`. |

Answers 201 with the work order, in the same shape as
`GET /api/work_orders/:id`. Like a webhook, the response carries
`x-meta-work-order-id` and `x-meta-run-id` headers.

A workflow that isn't in the path's project, or is marked deleted, answers 404
to a caller who may run the project's workflows. Every problem with the body
comes back in one 422; the run limits are checked only once it is valid.

Notable errors:

- 422 `invalid` with a `required` entry at `#/job_id` when neither id is sent,
  and an `exclusive` entry at `#/trigger_id` when both are.
- 422 `invalid` with a `not_found` entry at `#/job_id` or `#/trigger_id` when
  the id isn't in this workflow, or the trigger leads to no job.
- 422 `invalid` with an `exclusive` entry at `#/body` when both `dataclip_id`
  and `body` are sent, and a `type` entry when `body` isn't an object.
- 422 `invalid` with a `not_found` entry at `#/dataclip_id` when the dataclip
  isn't in this project, and a `dataclip_wiped` entry when its body has been
  wiped.
- 429 `too_many_runs` or 402 `exceeds_limit` for run limits.
- 409 `concurrent_edit` when the workflow is deleted while the work order is
  made.

## Retry many work orders

Status: **Private**

```
POST /api/projects/:project_id/work_orders/retries
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Send one of:

| Field | Type | Notes |
| --- | --- | --- |
| `filter` | object | The filters of the list endpoint, without `project_id`. Retries every work order in the project that matches when Lightning receives the request. |
| `work_order_ids` | array of UUIDs | At most 100. Ids outside the project match nothing. |

and optionally:

| Field | Type | Notes |
| --- | --- | --- |
| `job_id` | UUID | Retry from this job instead of each work order's start. All the work orders must be from the job's workflow. |

Each work order gets a new run, as for
[retrying a run](./runs.md#retry-a-run). Answers 202 with
`{"enqueued": 40, "discarded": 2}`. Discarded work orders are those whose input
has been wiped or whose workflow has been deleted, and, with a `job_id`, those
whose last run never reached the job. Without a `job_id` the runs are made in
the background; with one, in the request.

Notable errors:

- 422 `invalid` with an `exclusive` entry at `#/work_order_ids` when both
  `filter` and `work_order_ids` are sent, or a `required` entry at `#/filter`
  when neither is.
- 422 `invalid` with an entry at `#/filter/<name>` for a bad filter, and an
  `unknown_key` entry for a filter the list endpoint doesn't take.
- 422 `invalid` with a `not_found` entry at `#/job_id` when the job isn't in
  this project, and a `mismatch` entry when it isn't in the workflow of every
  work order.
- 429 `too_many_runs` or 402 `exceeds_limit` for run limits, counted on the
  work orders that can be retried.

## Cancel a work order

Status: **Private**

```
PATCH /api/work_orders/:id
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Body: `{"state": "cancelled"}`. No other field or state is accepted. Cancels
every run of the work order that no worker has claimed yet. Answers 200 with
the work order. An unknown or malformed id answers 403 `forbidden`.

Notable errors:

- 422 `invalid` with a `not_allowed` entry at `#/state` for another state, or
  for a work order with no run waiting for a worker, as for
  [cancelling a run](./runs.md#cancel-a-run).
- 409 `concurrent_edit` when a worker claims the runs first.

## Cancel many work orders

Status: **Private**

```
POST /api/projects/:project_id/work_orders/cancellations
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Takes `filter` or `work_order_ids`, as for retrying many, with the same
errors. Cancels the runs no worker has claimed yet. Answers 202 with
`{"cancelled": 12}`, a number of work orders, not runs:

- Work orders listed by id are cancelled in the request, at most 100 runs in
  all. `cancelled` counts the work orders whose runs it cancelled.
- A filter's work orders are cancelled in the background, 100 runs at a time
  until none are left. `cancelled` counts the matching work orders that had a
  run waiting for a worker when the request arrived.

## History exports

An export is a zip of work orders, with their inputs, outputs and logs.
Lightning builds it in the background.

```json
{
  "data": {
    "type": "history_exports",
    "id": "…",
    "attributes": {
      "state": "completed",
      "filename": "….zip",
      "created_by_id": "…",
      "created_by_name": "Ada Lovelace",
      "download_url": "https://.../api/projects/…/history_exports/…/download",
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/…/history_exports/…" }
  }
}
```

`state` is `enqueued`, `in_progress`, `completed` or `failed`. `filename` and
`download_url` are `null` until the export is `completed`. `created_by_id` and
`created_by_name` are the user who asked for it. Fetch `download_url` with the
same token.

### Export history

Status: **Private**

```
POST /api/projects/:project_id/history_exports
```

Tokens: personal access token of a project owner, admin or editor.

The service account is refused 403 `forbidden` on every history export route.

Body: `{"filter": {…}}`, the filters of the list endpoint, as for retrying
many. Without `filter`, every work order in the project is exported. Any other
key, `work_order_ids` included, is an `unknown_key` entry in a 422. Answers
202 with the export, `state` `enqueued`. Lightning emails you when it is
ready. A failed export is marked `failed`, with no email. 409
`concurrent_edit` when the project is deleted while the export is asked for.

### List history exports

Status: **Private**

```
GET /api/projects/:project_id/history_exports
```

Tokens: personal access token. Any project member, viewers included. Paged,
newest first. Returns `{"data": [<export>, …], "included": [], "links": {…}}`.

### Get a history export

Status: **Private**

```
GET /api/projects/:project_id/history_exports/:id
```

Tokens: personal access token. Any project member, viewers included.

Returns the export. One that isn't in the path's project answers 404 to a
member.

### Download a history export

Status: **Private**

```
GET /api/projects/:project_id/history_exports/:id/download
```

Tokens: as for getting an export.

Answers 200 with the zip. With cloud storage it answers a redirect to a signed
storage URL instead. An export that isn't `completed` yet has no file, and
answers 404 `not_found`, as does one that isn't in the path's project.

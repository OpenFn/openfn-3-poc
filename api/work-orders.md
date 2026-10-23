# Work orders

## List and get work orders

Status: **Public**

Tokens: personal access token. Read only. Service account support is planned.

```
GET /api/work_orders
GET /api/work_orders?project_id=:project_id
GET /api/projects/:project_id/work_orders
GET /api/work_orders/:id
```

Lists are paged and take these filters:

| Parameter | Notes |
| --- | --- |
| `id` | Comma-separated work order ids. |
| `workflow_id` | UUID. |
| `state` | Comma-separated: `rejected`, `pending`, `running`, `success`, `failed`, `crashed`, `cancelled`, `killed`, `exception`, `lost`. |
| `inserted_after`, `inserted_before` | ISO 8601. |
| `updated_after`, `updated_before` | ISO 8601. |

Every bad filter is reported together in one 400 `invalid_parameter`. An
unknown `project_id` answers 404.

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

- `search`: text to find in work orders, with `search_fields`, a
  comma-separated choice of `id`, `dataclip_name`, `body` (the input) and `log`.
  Defaults to all four. A search counts at most 50 matches, and `meta` says
  when it stopped counting.
- `sort`: `inserted_at` or `last_activity`, with a `-` prefix for descending.
  Defaults to `-last_activity`.
- `include=runs`: adds each work order's runs, in the same shape as
  `GET /api/runs/:id`, newest first.

## Run a workflow

Status: **Private**

```
POST /api/projects/:project_id/workflows/:workflow_id/work_orders
```

Tokens: personal access token of a project owner, admin or editor.

Starts a work order by hand, the way the app's Run button does.

| Field | Type | Notes |
| --- | --- | --- |
| `job_id` | UUID | The job to start from. Send this or `trigger_id`. |
| `trigger_id` | UUID | Start from the job this trigger leads to. |
| `dataclip_id` | UUID | Optional. An existing input to reuse. |
| `body` | object | Optional. A new input. Send this or `dataclip_id`, not both. Defaults to `{}`. |

Answers 201 with the work order, in the same shape as
`GET /api/work_orders/:id`. Like a webhook, the response carries
`x-meta-work-order-id` and `x-meta-run-id` headers.

Notable errors:

- 422 `invalid` with an entry at `#/job_id` or `#/trigger_id` when neither or
  both are sent, or the id isn't in this workflow.
- 422 `invalid` with an `exclusive` entry when both `dataclip_id` and `body`
  are sent.
- 422 `invalid` with a `dataclip_wiped` entry when the dataclip's body has been
  wiped.
- 429 `too_many_runs` or 402 `exceeds_limit` for run limits.

> Implementation note: the app calls this through a session-cookie route,
> `POST /projects/:project_id/workflows/:workflow_id/runs`
> (`LightningWeb.WorkflowController.create_run/2`), which builds a
> `Lightning.WorkOrders.Manual` and calls `Lightning.WorkOrders.create_for/1`.
> Differences:
>
> - The input field is `custom_body`, a JSON string, not `body` as an object.
> - It answers `{"data": {"workorder_id", "run_id", "dataclip"}}`, not the
>   work order resource.
> - It needs both the `:edit_workflow` and `:run_workflow` policy actions.
> - The spec's input checks are new: today `job_id` wins if both ids are sent,
>   a trigger starts its first edge's job, `dataclip_id` silently wins over a
>   body, and a wiped dataclip isn't refused.

## Retry many work orders

Status: **Planned**

```
POST /api/projects/:project_id/work_orders/retries
```

Tokens: personal access token of a project owner, admin or editor.

Send one of:

| Field | Type | Notes |
| --- | --- | --- |
| `filter` | object | The filters of the list endpoint. Retries every work order that matches when Lightning receives the request. |
| `work_order_ids` | array of UUIDs | At most 100. |

and optionally:

| Field | Type | Notes |
| --- | --- | --- |
| `job_id` | UUID | Retry from this job instead of each work order's start. All the work orders must be from the job's workflow. |

Each work order gets a new run, as for
[retrying a run](./runs.md#retry-a-run). Work orders whose input has been
wiped, or whose workflow has been deleted, are skipped. Answers 202 with
`{"enqueued": 40, "discarded": 2}`. Large sets are retried in the background.

Notable errors:

- 422 `invalid` with an `exclusive` entry when both `filter` and
  `work_order_ids` are sent, or a `required` entry when neither is.
- 422 `invalid` with a `mismatch` entry at `#/job_id` when the work orders
  are from more than one workflow.
- 429 `too_many_runs` or 402 `exceeds_limit` for run limits, counted on the
  work orders that can be retried.

## Cancel a work order

Status: **Planned**

```
PATCH /api/work_orders/:id
```

Tokens: personal access token of a project owner, admin or editor.

Body: `{"state": "cancelled"}`. Cancels every run of the work order that no
worker has claimed yet. Answers 200 with the work order. A work order with no
such run answers 422 `invalid` with a `not_allowed` entry at `#/state`, as for
[cancelling a run](./runs.md#cancel-a-run).

## Cancel many work orders

Status: **Planned**

```
POST /api/projects/:project_id/work_orders/cancellations
```

Tokens: personal access token of a project owner, admin or editor.

Takes `filter` or `work_order_ids`, as for retrying many. Cancels the runs no
worker has claimed yet. Answers 202 with `{"cancelled": 12}`. Large sets are
cancelled in the background.

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
      "download_url": "https://.../api/projects/…/history_exports/…/download",
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/…/history_exports/…" }
  }
}
```

`state` is `enqueued`, `in_progress`, `completed` or `failed`. `download_url`
is `null` until the export is `completed`. Fetch it with the same token.

### Export history

Status: **Planned**

```
POST /api/projects/:project_id/history_exports
```

Tokens: personal access token of a project owner or admin.

Body: `{"filter": {…}}`, the filters of the list endpoint. Answers 202 with
the export, `state` `enqueued`. Lightning also emails you when it is ready.

### List history exports

Status: **Planned**

```
GET /api/projects/:project_id/history_exports
```

Tokens: personal access token of a project owner or admin. Paged, newest first.

### Get a history export

Status: **Planned**

```
GET /api/projects/:project_id/history_exports/:id
```

Tokens: personal access token of a project owner or admin.

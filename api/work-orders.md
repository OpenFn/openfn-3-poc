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

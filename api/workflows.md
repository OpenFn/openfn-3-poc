# Workflows

Tokens: personal access token. Creating, changing and deleting need editor or
above. Service account support is planned.

## The workflow object

```json
{
  "id": "…",
  "name": "Data processing pipeline",
  "project_id": "…",
  "concurrency": null,
  "enable_job_logs": true,
  "positions": null,
  "inserted_at": "…",
  "updated_at": "…",
  "jobs": [
    {
      "id": "…",
      "name": "Extract data",
      "body": "fn(state => state)",
      "adaptor": "@openfn/language-common@latest",
      "project_credential_id": null,
      "keychain_credential_id": null
    }
  ],
  "triggers": [
    {
      "id": "…",
      "type": "webhook",
      "enabled": true,
      "cron_expression": null,
      "cron_cursor_job_id": null,
      "custom_path": null,
      "comment": null,
      "webhook_reply": "before_start",
      "webhook_response_config": null
    }
  ],
  "edges": [
    {
      "id": "…",
      "source_trigger_id": "…",
      "source_job_id": null,
      "target_job_id": "…",
      "condition_type": "always",
      "condition_expression": null,
      "condition_label": null,
      "enabled": true
    }
  ]
}
```

- Trigger `type`: `webhook` or `cron`.
- Trigger `webhook_reply`: `before_start`, `after_completion` or `custom`.
- Edge `condition_type`: `always`, `on_job_success`, `on_job_failure` or
  `js_expression`.

Planned additional scope: `webhook_auth_method_ids` on webhook triggers, the
[webhook auth methods](./webhooks.md#webhook-auth-methods) a request must pass.
Sending it in an update replaces the trigger's set. Each id must belong to the
workflow's project.

## List workflows

Status: **Public**

```
GET /api/workflows
GET /api/workflows?project_id=:project_id
GET /api/projects/:project_id/workflows
```

Returns `{"workflows": [<workflow>, …]}` for every project you can access, or
for one project. Not paged.

Planned additional scope:

- `credential_id`: only workflows with a job that uses this credential. Use it
  before unlinking or deleting a credential to see what would lose it.
- `q` (a name search), `sort` (`name` or `updated_at`), and paging.
- `include=stats`: adds the last 30 days' `work_orders_count`,
  `failed_work_orders_count` and `last_work_order_at` to each workflow.

## Get a workflow

Status: **Public**

```
GET /api/workflows/:id
GET /api/projects/:project_id/workflows/:id
```

Returns `{"workflow": <workflow>}`.

## Create a workflow

Status: **Public**

```
POST /api/projects/:project_id/workflows
```

Send the workflow with its `name`, `jobs`, `triggers` and `edges`. Give each
job and trigger an `id` of your choosing so edges can refer to them. Lightning
replaces those ids with new UUIDs in the response.

```json
{
  "name": "Data processing pipeline",
  "jobs": [
    { "id": "extract", "name": "Extract data", "adaptor": "@openfn/language-common@latest", "body": "fn(state => state)" }
  ],
  "triggers": [{ "id": "webhook", "type": "webhook", "enabled": true }],
  "edges": [
    { "source_trigger_id": "webhook", "target_job_id": "extract", "condition_type": "always" }
  ]
}
```

Rules: every job and trigger has an id, edges form no cycle, at most one
trigger is enabled, and exactly one enabled edge leaves the triggers. An edge
from a trigger must be `always` or `js_expression`. Answers 201
`{"workflow": <workflow>}`. Enabling a trigger beyond the plan's limit answers
402 `exceeds_limit`.

Planned additional scope: `template_id`, to start from a
[workflow template](#list-workflow-templates) instead of sending `jobs`,
`triggers` and `edges`. Lightning gives the copy new ids.

## Validate a workflow

Status: **Planned**

```
POST /api/projects/:project_id/workflows/validations
```

Tokens: as for creating a workflow.

Send a workflow as you would to create one, or with an `id` as you would to
update one. Lightning checks it with the same rules and saves nothing. Answers
204 with no body if it would be accepted, and the same 422 `invalid` the write
would give if not. Plan limits aren't checked, since nothing is enabled.

## Update a workflow

Status: **Public**

```
PATCH /api/projects/:project_id/workflows/:id
PUT /api/projects/:project_id/workflows/:id
```

Send the fields to change. A list you send (`jobs`, `triggers`, `edges`)
replaces the stored one, so send every item you want to keep. New jobs and
triggers need UUIDs you generate. Triggers can be changed or added but not
removed. Answers 200 `{"workflow": <workflow>}`.

A workflow open in the editor answers 409 `being_edited`. A save that loses a
race with another change answers 409 `concurrent_edit`.

## Delete a workflow

Status: **Private**

```
DELETE /api/projects/:project_id/workflows/:id
```

Tokens: personal access token of a project owner, admin or editor.

Marks the workflow deleted. Its triggers are disabled straight away, and it no
longer appears in lists or answers `GET`. Its run history stays until the
project's retention policy removes it. Answers 204 with no body. A workflow
open in the editor answers 409 `being_edited`.

> Implementation note: `Lightning.Workflows.mark_for_deletion/3` soft deletes
> the workflow, disables and unbinds its triggers, and records the audit event.
> The policy action is `:delete_workflow` (owners, admins and editors).
> `Lightning.Workflows.delete_workflow/1` is a separate hard delete that only
> works once the workflow has no history. Neither checks whether the workflow
> is open in the editor; the route has to. The project's workflow list doesn't
> filter out soft-deleted workflows yet.

## Workflow snapshots

Every save that changes a workflow keeps a snapshot of it, numbered by
`lock_version`. A run records the snapshot it ran, so an old run can be read
against the workflow as it was.

### List a workflow's snapshots

Status: **Planned**

```
GET /api/workflows/:id/snapshots
```

Tokens: personal access token. Paged, newest first.

```json
{
  "data": [{ "id": "…", "lock_version": 7, "inserted_at": "…", "latest": true }],
  "links": { "self": "…", "first": "…", "last": "…", "next": "…", "prev": null }
}
```

These are the ids `GET /api/provision/:id?snapshots[]=` takes.

### Get a snapshot

Status: **Planned**

```
GET /api/workflows/:id/snapshots/:snapshot_id
```

Tokens: personal access token.

Returns `{"snapshot": <workflow>}`: the workflow object as it was, with its
`lock_version`. A snapshot can't be changed.

## List a workflow's versions

Status: **Planned**

```
GET /api/workflows/:id/versions
```

Tokens: personal access token. Paged, newest first.

```json
{ "data": [{ "hash": "a1b2c3d4e5f6", "source": "cli", "inserted_at": "…" }] }
```

Each save records a hash of the workflow and where the save came from: `app`
or `cli`. Comparing hashes tells a CLI whether the app and its local copy have
moved apart. Consecutive saves from the same source keep one entry.

## Workflow templates

A template is a workflow published for anyone on the instance to start from.

### List workflow templates

Status: **Planned**

```
GET /api/workflow_templates
```

Tokens: personal access token. Paged. Takes `q` (name and description) and
`tags` (comma-separated).

```json
{
  "data": [
    {
      "id": "…",
      "name": "DHIS2 to FHIR",
      "description": "…",
      "tags": ["dhis2", "fhir"],
      "workflow_id": "…",
      "code": "<the workflow as YAML>"
    }
  ]
}
```

### Publish a workflow as a template

Status: **Planned**

```
PUT /api/workflows/:id/template
```

Tokens: personal access token of a support user who can open the project.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. At most 255 characters. |
| `description` | string | Optional. At most 1000 characters. |
| `tags` | array of strings | Optional. |

Publishes the workflow as it is now. A workflow has at most one template, so
publishing again updates it. Answers 201 when it creates and 200 when it
updates.

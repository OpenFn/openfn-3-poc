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

## List workflows

Status: **Public**

```
GET /api/workflows
GET /api/workflows?project_id=:project_id
GET /api/projects/:project_id/workflows
```

Returns `{"workflows": [<workflow>, …]}` for every project you can access, or
for one project. Not paged.

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

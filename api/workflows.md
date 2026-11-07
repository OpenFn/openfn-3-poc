# Workflows

Tokens: personal access token, or service account with `projects:write`.
Creating, changing and deleting need editor or above.

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

Planned additional scope: `lock_version`, the version of the workflow's latest
[snapshot](#workflow-snapshots). A snapshot with the same `lock_version` is the
current one.

## List workflows

Status: **Public**

```
GET /api/workflows
GET /api/workflows?project_id=:project_id
GET /api/projects/:project_id/workflows
```

Returns `{"workflows": [<workflow>, …]}` for every project you can access, or
for one project. Not paged. The service account can access every project. A
`project_id` you may not access answers 403 `forbidden`, whether or not the
project exists; see [who hears 404](./errors.md#who-hears-404).

Workflows marked deleted are left out of the list of every project. A
project's list, on the nested route or with `project_id`, still includes them.

Planned additional scope:

- Leaving workflows marked deleted out of a project's list too (built on
  `full-api-test`, not merged yet).
- `credential_id`: only workflows with a job that uses this credential. Use it
  before unlinking or deleting a credential to see what would lose it.
- `q` (a name search), `sort` (`name` or `updated_at`), and paging.
- `include=stats`: adds a `stats` object to each workflow, covering the last
  30 days:
  - `last_work_order` and `last_failed_work_order`: `{state, updated_at}` of
    the latest work order, and of the latest one in a failure state, or `null`.
  - `work_orders`: counts by outcome, `success`, `failed`, `pending` and
    `cancelled`. `work_orders_count` (their sum) and
    `failed_work_orders_count` sit beside it in `stats`.
  - `runs`: counts `success`, `failed` and `pending`.
  - `step_count` and `step_success_rate` (a percentage to two decimals, of
    finished steps).

  Work orders are in the window by last activity, runs and steps by when they
  were created. With it, `sort` also takes `last_work_order_updated_at`,
  `work_orders_count` and `failed_work_orders_count`. The project's metric
  cards are sums of `work_orders` and `runs` across its workflows.

> Implementation note: `Lightning.DashboardStats.get_workflows_stats/1`
> computes `include=stats` for a list of workflows in batched queries, and
> `sort_workflow_stats/3` and `aggregate_project_metrics/1` do the sorting and
> the project totals. They name the fields `workorders_count`,
> `failed_workorders_count`, `grouped_workorders_count` and
> `grouped_runs_count`.

## Get a workflow

Status: **Public**

```
GET /api/workflows/:id
GET /api/projects/:project_id/workflows/:id
```

Returns `{"workflow": <workflow>}`.

On the nested route, a workflow that isn't in the path's project, or is marked
deleted, answers 404 to a caller who can access the project. On
`/api/workflows/:id`, a caller who may not access the workflow's project
answers 403 `forbidden`, and so does an unknown or malformed id, unless the
caller is the service account, which hears 404 or 400.

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
`{"workflow": <workflow>}`. A name another workflow in the project has answers
422 `invalid` with a `taken` entry. Every error in the body comes back in one 422. Enabling a trigger beyond
the plan's limit answers 402 `exceeds_limit`, checked only once the body is
valid.

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
removed. A body `id` or `project_id` that differs from the path answers 422,
and so does a job or trigger id another workflow uses (a `taken` entry).
Answers 200 `{"workflow": <workflow>}`.

`PUT` is an update like `PATCH`: it never creates, so an unknown id answers
404 to a caller who may change the project's workflows. A caller who may not
answers 403 `forbidden` whatever the id.

A workflow open in the editor answers 409 `being_edited`, before the body is
read. A save that loses a race with another change answers 409
`concurrent_edit`.

## Delete a workflow

Status: **Private**

```
DELETE /api/projects/:project_id/workflows/:id
```

Tokens: personal access token of a project owner, admin or editor. The
service account is refused 403 `forbidden`, though it may create and update
workflows: a deleted workflow can't be restored.

Marks the workflow deleted. Its triggers are disabled and unbound straight
away, and it no longer appears in lists or answers `GET`. Its run history
stays until the project's retention policy removes it. Answers 204 with no
body. A workflow open in the editor answers 409 `being_edited`, and one another
request deleted first 409 `concurrent_edit`.

## Workflow snapshots

Every save that changes a workflow keeps a snapshot of it, numbered by
`lock_version`. A run records the snapshot it ran, so an old run can be read
against the workflow as it was.

### List a workflow's snapshots

Status: **Private**

```
GET /api/workflows/:id/snapshots
```

Tokens: personal access token of any project member. The service account is
refused 403 `forbidden`. Paged, newest first by `lock_version`.

```json
{
  "data": [{ "id": "…", "lock_version": 7, "inserted_at": "…", "latest": true }],
  "links": { "self": "…", "first": "…", "last": "…", "next": "…", "prev": null }
}
```

`latest` is `true` on the snapshot whose `lock_version` is the workflow's.
These are the ids `GET /api/provision/:id?snapshots[]=` takes. An unknown or
malformed workflow id answers 403 `forbidden`, as for a workflow in a project
you can't access.

### Get a snapshot

Status: **Private**

```
GET /api/workflows/:id/snapshots/:snapshot_id
```

Tokens: as for listing snapshots.

Returns `{"snapshot": …}`: the workflow as it was. A snapshot can't be changed.

```json
{
  "snapshot": {
    "id": "…",
    "name": "Data processing pipeline",
    "project_id": "…",
    "lock_version": 7,
    "positions": null,
    "inserted_at": "…",
    "jobs": [],
    "triggers": [],
    "edges": []
  }
}
```

`id` is the workflow's, and `inserted_at` is when the snapshot was taken. Jobs,
triggers and edges have the same fields as on the workflow object. A snapshot
doesn't store `concurrency` or `enable_job_logs`, so they are left out, and it
has no `updated_at`.

A snapshot id the workflow doesn't have answers 404 `not_found`, and one that
isn't a UUID 400 `invalid_parameter`, once you may read the workflow.

## List a workflow's versions

Status: **Private**

```
GET /api/workflows/:id/versions
```

Tokens: as for listing snapshots. Paged, newest first.

```json
{
  "data": [{ "hash": "a1b2c3d4e5f6", "source": "cli", "inserted_at": "…" }],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

Each save records a hash of the workflow and where the save came from: `app`
or `cli`. Comparing hashes tells a CLI whether the app and its local copy have
moved apart. Consecutive saves from the same source keep one entry, except
the first entry, which is never replaced, so the oldest two entries can share
a source. An unknown or malformed workflow id answers 403 `forbidden`.

## Workflow templates

A template is a workflow published for anyone on the instance to start from.

### List workflow templates

Status: **Private**

```
GET /api/workflow_templates
```

Tokens: personal access token. The service account is refused 403
`forbidden`. Paged, by name. Takes `q` (name and description) and `tags`
(comma-separated; a template must carry every one).

```json
{
  "data": [
    {
      "id": "…",
      "name": "DHIS2 to FHIR",
      "description": "…",
      "tags": ["dhis2", "fhir"],
      "workflow_id": "…",
      "code": "<the workflow as v2 YAML>"
    }
  ],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

### Publish a workflow as a template

Status: **Private**

```
PUT /api/workflows/:id/template
```

Tokens: personal access token of a support user who is a member of the
project, or whose project allows support access. The service account is
refused 403 `forbidden`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. At most 255 characters. |
| `description` | string | Optional. At most 1000 characters. |
| `tags` | array of strings | Optional. Defaults to `[]`. |

Publishes the workflow as it is saved now, as v2 YAML with its positions. A
workflow has at most one template, so publishing again replaces it. Answers
201 `{"template": <template>}` when it creates and 200 when it replaces, with
the template as in the list.

Notable errors:

- 403 `forbidden` for an unknown or malformed workflow id, as for a workflow
  in a project you may not publish from.
- 422 `invalid` for a bad field, with an `unknown_key` entry for any other key.
- 409 `export_conflict` when two items in the workflow export under the same
  key.
- 409 `concurrent_edit` when the workflow is deleted while publishing.

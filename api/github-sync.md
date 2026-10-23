# GitHub sync

A project can be connected to a GitHub repository. Lightning adds a GitHub
Action and a [GitHub sync token](./authentication.md) to the repo, so changes
pushed to the branch deploy to the project, and a sync commits the project to
the branch. Lightning talks to GitHub through its GitHub App, as the person who
connected the repo, so that person must have connected their GitHub account in
the app.

## The repo connection object

```json
{
  "data": {
    "type": "repo_connections",
    "id": "…",
    "attributes": {
      "repo": "openfn/malaria-programme",
      "branch": "main",
      "github_installation_id": "12345678",
      "config_path": "./openfn-a1b2c3d4-config.json",
      "verified": false,
      "problems": ["missing_deploy_yml"],
      "inserted_at": "…",
      "updated_at": "…"
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/…/repo_connection" }
  }
}
```

`verified` and `problems` come from checking the repo on GitHub: whether the
pull and deploy workflows, the config file and the repo secret are all there.
`problems` can hold `missing_pull_yml`, `missing_deploy_yml`,
`missing_config` and `missing_api_secret`. The token Lightning stores in the
repo is never returned.

## Get a project's repo connection

Status: **Planned**

```
GET /api/projects/:project_id/repo_connection
```

Tokens: personal access token. A project with no connection answers 404
`not_found`. GitHub being unreachable doesn't fail the request; `verified` is
`false` and `problems` says why.

## Connect or reconnect a repo

Status: **Planned**

```
PUT /api/projects/:project_id/repo_connection
```

Tokens: personal access token of a project owner or admin, who has connected
their GitHub account.

| Field | Type | Notes |
| --- | --- | --- |
| `github_installation_id` | string | Required. The GitHub App installation that can reach the repo. |
| `repo` | string | Required. `owner/name`. |
| `branch` | string | Required. |
| `sync_direction` | string | `pull` (the project is the source: sync it to the repo now) or `deploy` (the repo is the source). Defaults to `pull`. |
| `config_path` | string | Required for `deploy`. Where the project's config is in the repo. |

Creates the connection, or replaces it, and writes the GitHub workflows,
config and secret to the repo again. Answers 201 when it creates and 200 when it
replaces.

Notable errors:

- 422 `invalid` with a `required` entry at `#/config_path` for `deploy` without
  one.
- 402 `exceeds_limit` when the plan doesn't include GitHub sync.
- 503 `service_unavailable` when GitHub refuses or doesn't answer. Nothing is
  saved.

## Disconnect a repo

Status: **Planned**

```
DELETE /api/projects/:project_id/repo_connection
```

Tokens: personal access token of a project owner or admin.

Removes the connection, and then tries to remove the deploy workflow, config
and secret from the repo. It answers 204 with no body even if GitHub can't be
reached, so check the repo if that matters.

## Sync to GitHub

Status: **Planned**

```
POST /api/projects/:project_id/repo_connection/syncs
```

Tokens: personal access token of a project owner, admin or editor.

Body: `{"commit_message": "…"}`, optional. Starts the GitHub Action that
commits the latest version of every workflow to the branch. It runs on GitHub,
so this answers 202 with no body as soon as the Action has started. Each call
starts a new run.

A plan limit answers 402 `exceeds_limit`.

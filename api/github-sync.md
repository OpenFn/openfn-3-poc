# GitHub sync

A project can be connected to a GitHub repository. Lightning adds a GitHub
Action and a [GitHub sync token](./authentication.md) to the repo, so changes
pushed to the branch deploy to the project, and a sync commits the project to
the branch. Connecting and disconnecting write to the repo as the person doing
it, so that person must have connected their GitHub account in the app.
Checking the repo and syncing use Lightning's GitHub App installation instead.

Every route here is for people only. The service account has no GitHub
account, so it gets 403 `forbidden`.

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
  },
  "links": { "self": "https://.../api/projects/…/repo_connection" }
}
```

`verified` and `problems` come from checking the repo on GitHub: whether the
pull and deploy workflows, the config file and the repo secret are all there.
`problems` can hold `missing_pull_yml`, `missing_deploy_yml`,
`missing_config` and `missing_api_secret`, or `github_unavailable` when
GitHub couldn't be asked. `config_path` is the real path, also when Lightning
wrote the default config. The token Lightning stores in the repo is never
returned.

## Get a project's repo connection

Status: **Private**

```
GET /api/projects/:project_id/repo_connection
```

Tokens: personal access token of any member. A project with no connection
answers 404 `not_found`. GitHub being unreachable doesn't fail the request;
`verified` is `false` and `problems` holds `github_unavailable`.

Planned additional scope: `sync_version` and `workspace_path` for a v2 (CLI
workspace) connection.

## Connect or reconnect a repo

Status: **Private**

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
| `config_path` | string | Required for `deploy`. Where the project's config is in the repo. A plain path inside the repo. |

Creates the connection, or replaces it, and writes the GitHub workflows,
config and secret to the repo again. For `pull` it also starts a sync.
Answers 201 when it creates and 200 when it replaces, with `verified: true`,
since it has just written every part. A body with the same installation,
repo, branch and config path reconnects; one that changes any of them removes
the old connection and creates the new one, and tries to clean up what the
old one wrote. A v2 connection stays v2.

Any other key answers 422 with an `unknown_key` entry.

Notable errors:

- 422 `invalid` with a `required` entry at `#/config_path` for `deploy`
  without one, and a `not_allowed` entry there for a path outside the repo.
- 422 `invalid` with a `tree_branch_conflict` entry at `#/branch` when
  another project in the same family is connected to the repo and branch.
- 403 `forbidden` when the caller hasn't connected a GitHub account, or their
  GitHub sign-in has lapsed.
- 402 `exceeds_limit` when the plan doesn't include GitHub sync.
- 409 `export_conflict` when two of the project's workflows or jobs would
  export under the same name. Nothing is written.
- 503 `service_unavailable` when GitHub refuses or doesn't answer. Nothing is
  saved, but files already pushed stay in the repo.
- 409 `concurrent_edit` when another request removes the connection
  meanwhile.

## Disconnect a repo

Status: **Private**

```
DELETE /api/projects/:project_id/repo_connection
```

Tokens: personal access token of a project owner or admin, who has connected
their GitHub account.

Removes the connection, and then tries to remove the deploy workflow, config
and secret from the repo. It answers 204 with no body even if GitHub can't be
reached, so check the repo if that matters. The shared `openfn-pull.yml` on
the default branch is left in place, and a v2 connection's `openfn.yaml` too.

Notable errors:

- 404 `not_found` when the project has no connection.
- 403 `forbidden` when the caller hasn't connected a GitHub account.
- 409 `concurrent_edit` when another request removes the connection
  meanwhile.

## Sync to GitHub

Status: **Private**

```
POST /api/projects/:project_id/repo_connection/syncs
```

Tokens: personal access token of a project owner, admin or editor.

Body: `{"commit_message": "…"}`, optional. It defaults to "user <email>
initiated a sync from Lightning". Starts the GitHub Action that commits the
latest version of every workflow to the branch. It runs on GitHub, so this
answers 202 with no body as soon as the Action has started. Each call starts
a new run. Any other key answers 422 with an `unknown_key` entry.

Notable errors:

- 404 `not_found` when the project has no connection.
- 402 `exceeds_limit` for a plan limit.
- 409 `export_conflict` when two of the project's workflows or jobs would
  export under the same name.
- 503 `service_unavailable` when GitHub refuses or doesn't answer.

Planned additional scope: an audit event for each sync.

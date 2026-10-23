# Projects

## Get a project

Status: **Public**

```
GET /api/projects/:id
```

Tokens: personal access token, or service account with `projects:write`.

```json
{
  "data": {
    "type": "projects",
    "id": "a1b2c3d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
    "attributes": {
      "name": "malaria-programme",
      "description": "Malaria case reporting",
      "members": [
        { "email": "ada@example.com", "role": "owner" },
        { "email": "grace@example.com", "role": "editor" }
      ]
    },
    "relationships": {},
    "links": { "self": "https://.../api/projects/a1b2c3d4-..." }
  },
  "included": [],
  "links": { "self": "https://.../api/projects/a1b2c3d4-..." }
}
```

Planned additional scope:

- The project's settings as attributes: `color`, `env`, `concurrency`,
  `retention_policy`, `history_retention_period`, `dataclip_retention_period`,
  `requires_mfa`, `allow_support_access`, `parent_id` and
  `scheduled_deletion`. Each is set through its own route, below.
- `allowed_retention_periods`: the retention periods the project's plan
  allows, so a client can offer only those.

## Create or replace a project

Status: **Public**

```
PUT /api/projects/:id
```

Tokens: service account with `projects:write`, or personal access token. With a
personal access token, creating a project needs a superuser, and replacing one
needs its owner or admin. Creating a project with any user's personal access
token, subject to their role, is planned.

Creates the project under `:id`, or replaces the name and description of the
project that has it.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Lowercase letters, digits and hyphens. |
| `description` | string | Optional. At most 240 characters. |
| `members` | array of `{email, role}` | Only applied on create. Each email must belong to an existing user. `role` is `owner`, `admin`, `editor` or `viewer`. A new project needs exactly one owner. |
| `notify` | boolean | Only applied on create. Whether to email the members added. Defaults to `true`. |
| `id` | UUID | Optional. Must match the path if sent. |

Any other key answers 422 with an `unknown_key` entry.

```bash
curl -X PUT https://lightning.example.org/api/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "malaria-programme",
    "description": "Malaria case reporting",
    "members": [
      {"email": "ada@example.com", "role": "owner"},
      {"email": "grace@example.com", "role": "editor"}
    ],
    "notify": false
  }'
```

Answers 201 with the project (same shape as `GET`) when it creates one, and
200 when it replaces one.

Notable errors:

- 422 `invalid` with a `not_found` entry at `#/members/N/email` for an email
  with no user, or `duplicate` for a user listed twice.
- 402 `exceeds_limit` with an entry at `#/members` when the plan has no seat
  for a member.
- 409 `scheduled_for_deletion` when the project is being deleted.

Planned additional scope:

- Any user can create a project with a personal access token, and becomes its
  owner. They send no `members`.
- `color` (a hex colour such as `#336699`), `env` (an environment name such as
  `staging`) and `concurrency` (a positive integer, or `null` for no limit; `1`
  runs one at a time across the whole project). Changing them needs owner or
  admin, as for the name.

## List projects

Status: **Public**

```
GET /api/projects
```

Tokens: personal access token. Paged. Service account support is planned.

Lists the projects you are a member of, not including sandboxes. Each entry has
the same shape as `GET /api/projects/:id`, without `members`.

Planned additional scope:

- With a service account or a superuser's token, every project on the
  instance, including sandboxes, and a `q` filter on name and description.
- `sort`: `name` or `last_activity`, with a `-` prefix for descending.
- `include=stats`: adds `workflows_count`, `collaborators_count`,
  `last_activity`, and the last 30 days' `failed_work_orders_count` to each
  entry.

## Set a project's data retention

Status: **Planned**

```
PUT /api/projects/:id/data_retention
```

Tokens: personal access token of a project owner or admin, or service account
with `projects:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `retention_policy` | string | Required. `retain_all`, `retain_with_errors` or `erase_all`: which inputs and outputs of steps are saved. |
| `history_retention_period` | integer | Days to keep work orders, runs and logs. `null` keeps them. |
| `dataclip_retention_period` | integer | Days to keep step inputs and outputs. At most `history_retention_period`. Needs a history period, and is cleared when the policy is `erase_all`. |

Answers 200 with the project. Every owner and admin of the project gets an
email about the change. Sending the same body twice changes nothing and sends
no email.

Notable errors:

- 422 `invalid` with an `out_of_range` entry at `#/dataclip_retention_period`
  when it is longer than the history period.
- 422 `invalid` with a `not_allowed` entry when the plan doesn't allow a
  period. The periods allowed are in `allowed_retention_periods` on the
  project.

## Require MFA on a project

Status: **Planned**

```
PUT /api/projects/:id/mfa_requirement
```

Tokens: personal access token of a project owner or admin, or service account
with `projects:write`.

Body: `{"requires_mfa": true}` or `false`. When it is on, members who haven't
set up MFA get 403 `forbidden` from every route on the project. Answers 200
with the project.

Notable errors:

- 402 `exceeds_limit` when the plan doesn't include requiring MFA.
- 422 `invalid` with a `not_allowed` entry at `#/requires_mfa` for a sandbox.
  A sandbox follows the project it was created from.

## Allow support access to a project

Status: **Planned**

```
PUT /api/projects/:id/support_access
```

Tokens: personal access token of a project owner or admin, or service account
with `projects:write`.

Body: `{"allow_support_access": true}` or `false`. When it is on, the
instance's support users can open the project as editors without being
members. They don't appear in the member list. Answers 200 with the project.

## Delete a project

Status: **Private**

```
DELETE /api/projects/:id
```

Tokens: personal access token of a project owner, or service account with
`projects:write`.

Schedules the project for deletion. Lightning removes it after the instance's
retention period. Until then every route on the project answers 409
`scheduled_for_deletion`, and the deletion can be cancelled (below). Answers
204 with no body. Deleting a project that is already scheduled answers 409
`scheduled_for_deletion`.

The same route deletes a sandbox, since a sandbox is a project. A sandbox's
admins, and the owners and admins of the project it was created from, may
delete it too.

> Implementation note: `Lightning.Projects.schedule_project_deletion/1` does
> the work today, and `Lightning.Projects.Sandboxes.schedule_sandbox_deletion/2`
> for a sandbox. Differences:
>
> - `schedule_project_deletion/1` takes no actor, so it records no audit event.
>   The route should pass the caller through as the actor.
> - The policy action is `:delete_project` (owners only) in
>   `Lightning.Policies.ProjectUsers`, already granted to `projects:write`.
>   The sandbox functions take only a `User` as actor, so a service account
>   can't delete a sandbox yet.

## Cancel a project's deletion

Status: **Private**

```
DELETE /api/projects/:id/scheduled_deletion
```

Tokens: as for deleting the project.

Cancels a scheduled deletion. Answers 200 with the project, in the same shape as
`GET /api/projects/:id`. This is the one route that doesn't answer 409
`scheduled_for_deletion` for a project being deleted. A project that isn't
scheduled answers 404 `not_found`.

> Implementation note: `Lightning.Projects.cancel_scheduled_deletion/1`, and
> `Lightning.Projects.Sandboxes.cancel_scheduled_sandbox_deletion/2` for a
> sandbox. Differences: the project version takes an id and no actor, so it
> does no authorisation check and records no audit event. The route has to do
> both.

## List a project's members

Status: **Private**

```
GET /api/projects/:project_id/members
```

Tokens: personal access token, or service account with `projects:write`. Paged.

```json
{
  "data": [
    {
      "type": "project_members",
      "id": "604f0cd2-37fb-4833-a5e1-821555b5b314",
      "attributes": { "email": "ada@example.com", "role": "owner" },
      "relationships": {},
      "links": { "self": "https://.../api/projects/a1b2c3d4-.../members/604f0cd2-..." }
    }
  ],
  "included": [],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

A member's `id` is their user id.

Planned additional scope: `failure_alert` and `digest` attributes on each
member, the notifications they get for this project (see
[Set your notifications for a project](#set-your-notifications-for-a-project)).

> Implementation note: `Lightning.Projects.get_project_with_users!/1` loads the
> members, which is how `GET /api/projects/:id` lists them today. Differences:
> it isn't paged, and it raises for a missing project rather than returning an
> error.

## Add a member or change their role

Status: **Private**

```
PUT /api/projects/:project_id/members/:user_id
```

Tokens: personal access token of a project owner or admin, or service account
with `projects:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `role` | string | Required. `admin`, `editor` or `viewer`. |
| `notify` | boolean | Only applied when the user is added. Whether to email them. Defaults to `true`. |

Adds the user to the project, or changes the role of a member. Answers 201 when
it adds and 200 when it changes, with the member in the same shape as one entry
of the list. Sending the same body twice changes nothing.

Notable errors:

- 404 `not_found` when the user doesn't exist.
- 422 `invalid` with a `one_owner` entry at `#/role` when the body would make
  the user the owner, or change the owner's role. A project always has exactly
  one owner, and this route doesn't transfer ownership.
- 402 `exceeds_limit` when the plan has no seat for a new member.

> Implementation note: `Lightning.Projects.add_project_users/4` adds members
> (`project, [%{user_id, role}], actor, notify`), and
> `Lightning.Projects.update_project_with_users/4` changes roles. Differences:
> they take lists, the actor must be a `User`, and neither stops a sandbox's
> inherited admins being demoted. The policy action is `:add_project_user`
> (owners and admins).

## Invite someone new to a project

Status: **Planned**

```
POST /api/projects/:project_id/invitations
```

Tokens: personal access token of a project owner or admin, or service account
with `projects:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required. Must not belong to an existing user. |
| `first_name` | string | Required. |
| `last_name` | string | Required. |
| `role` | string | Required. `admin`, `editor` or `viewer`. |

Creates a user and adds them to the project. Lightning emails them a link to set
their password. Answers 201 with the member, in the same shape as one entry of
the member list. To add someone who already has an account, use
`PUT /api/projects/:project_id/members/:user_id`.

Notable errors:

- 409 `taken` with an entry at `#/email` when the email already has an account,
  with `existing` carrying their id, as for `POST /api/users`. A retry is safe.
- 402 `exceeds_limit` when the plan has no seat for a new member.

## Set your notifications for a project

Status: **Planned**

```
PUT /api/projects/:project_id/members/:user_id/notifications
```

Tokens: personal access token. Only the member themself can change these.

| Field | Type | Notes |
| --- | --- | --- |
| `failure_alert` | boolean | Required. Email when a run fails. Only sent if the plan includes alerts. |
| `digest` | string | Required. `never`, `daily`, `weekly` or `monthly`: a summary of the project's work orders. |

Answers 200 with the member. Anyone else, whatever their role, gets 403
`forbidden`.

## Remove a member

Status: **Private**

```
DELETE /api/projects/:project_id/members/:user_id
```

Tokens: as for adding a member.

Removes the member and revokes the project's access to credentials they own.
Answers 204 with no body. A user who isn't a member answers 404 `not_found`.
Removing the owner answers 422 `invalid` with a `one_owner` entry whose `path`
is `user_id`.

> Implementation note: `Lightning.Projects.delete_project_user!/2` takes the
> membership row and an actor, and records the audit event. Differences: it
> raises `ArgumentError` when asked to remove the owner (or a parent admin from
> a sandbox) instead of returning an error, so the route has to check first.
> The policy action is `:remove_project_user` (owners and admins).

## List a project's sandboxes

Status: **Private**

```
GET /api/projects/:project_id/sandboxes
```

Tokens: personal access token, or service account with `projects:write`. Paged.

Returns the project's direct sandboxes, each in the same shape as an entry of
`GET /api/projects`. Sandboxes scheduled for deletion are left out.

Planned additional scope:

- `depth=all`: every sandbox below the project, not just direct ones. Each
  carries `parent_id` so the client can build the tree.
- `include=scheduled`: sandboxes scheduled for deletion too, with
  `scheduled_deletion` set.

> Implementation note: `Lightning.Projects.list_sandboxes/1` takes a parent id.
> Differences: it isn't paged, and it deliberately includes sandboxes
> scheduled for deletion (it is also the walker that purges them), so the route
> has to filter those out. `Lightning.Projects.list_workspace_projects/2` is
> the user-facing alternative.

## Create a sandbox

Status: **Private**

```
PUT /api/projects/:project_id/sandboxes/:id
```

Tokens: personal access token of a project owner, admin or editor, or service
account with `projects:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique among the parent's sandboxes. |
| `color` | string | Optional. A hex colour such as `#336699`. |
| `env` | string | Optional. The environment name, such as `staging`. |
| `dataclip_ids` | array of UUIDs | Optional. Dataclips to copy from the parent. |

Creates a sandbox under `:id` by cloning the parent's workflows. Credentials are
shared with the parent, not copied, and every trigger in the sandbox starts
disabled. The parent's members are copied with their roles, except the parent's
owner becomes an admin and the caller becomes the sandbox's owner. Answers 201
with the sandbox in the same shape as `GET /api/projects/:id`. If a sandbox
already has the id, answers 200 with it unchanged; use `PUT /api/projects/:id`
to rename it.

Notable errors:

- 409 `taken` with an entry at `#/name` when a sibling has the name.
- 402 `exceeds_limit` when the plan has no room for another sandbox.
- 422 `invalid` when the parent is already at the instance's maximum nesting
  depth.

> Implementation note: `Lightning.Projects.Sandboxes.provision/3` does the work.
> Differences:
>
> - Lightning picks the id; it doesn't take a client id, so `PUT` can't be
>   idempotent until it does.
> - The actor must be a `User`, so a service account can't call it yet.
> - It returns `{:error, :unauthorized}` and `{:error, :nesting_too_deep}` as
>   atoms rather than changesets, so the route has to map them.
> - It doesn't check the plan's sandbox limit; only the app's form does.

## Preview a sandbox merge

Status: **Planned**

```
POST /api/projects/:project_id/sandboxes/:id/merge_previews
```

Tokens: as for merging the sandbox.

Body: `{"target_project_id": "…"}`, optional, defaulting to the sandbox's
parent. Nothing is written. Answers 200 with what a merge would do:

```json
{
  "target_project_id": "…",
  "workflows": [
    { "name": "intake", "source_workflow_id": "…", "target_workflow_id": "…", "change": "changed", "diverged": false },
    { "name": "reporting", "source_workflow_id": null, "target_workflow_id": "…", "change": "deleted", "diverged": false }
  ],
  "credentials": [{ "credential_id": "…", "name": "Acme DHIS2" }]
}
```

Workflows are paired by name. `change` is `new` (only in the sandbox),
`changed`, `unchanged`, or `deleted` (only in the target, and created before the
sandbox). `diverged` is `true` when the target's workflow has changed since the
sandbox was created, so merging would overwrite someone else's work.
`credentials` are the sandbox's credentials the target doesn't have.

Notable errors: 422 `invalid` with an entry at `#/target_project_id` when the
target is the sandbox itself, one of its own sandboxes, or scheduled for
deletion.

## Merge a sandbox

Status: **Private**

```
POST /api/projects/:project_id/sandboxes/:id/merges
```

Tokens: personal access token of an owner or admin of the sandbox who is also
an editor or above on the target project, or service account with
`projects:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `target_project_id` | UUID | Optional. Defaults to the sandbox's parent. |
| `workflow_ids` | array of UUIDs | Optional. Only merge these workflows. Defaults to all. |

Copies the sandbox's workflows into the target project, and creates any
collections the target is missing by name. Collection items are never copied,
and a merge never deletes collections. Answers 201 with the target project in
the same shape as `GET /api/projects/:id`.

A plan limit answers 402 `exceeds_limit`.

Planned additional scope:

- `deleted_target_workflow_ids`: workflows only the target has, to delete as
  part of the merge. Nothing is deleted unless it is listed.
- `credential_ids`: the sandbox's credentials to link to the target. Only
  credentials linked to the sandbox are taken.
- The sandbox is scheduled for deletion once it has merged, and the response
  says whether that worked.

> Implementation note: `Lightning.Projects.Sandboxes.merge/4` takes the
> sandbox, the target, the actor and an options map (`:selected_workflow_ids`,
> `:deleted_target_workflow_ids`, `:selected_credential_ids`,
> `:skip_collections`, `:record_release`). Differences: the caller must authorise
> `:merge_sandbox` first, and failures come back as `:merge_failed` or a usage
> limiter message, not a changeset.

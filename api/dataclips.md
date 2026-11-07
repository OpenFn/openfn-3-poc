# Dataclips

A dataclip is the input or output of a step, or a saved input.

## List a project's dataclips

Status: **Planned**

```
GET /api/projects/:project_id/dataclips
```

Tokens: personal access token. Paged, newest first.

Lists dataclips without their bodies. Each entry is the dataclip object with
`body` left out. Filters:

| Parameter | Notes |
| --- | --- |
| `q` | A name, an id, or the start of an id. |
| `type` | One of the types below. |
| `named` | `true` for saved inputs only. |
| `job_id` | Only dataclips that can be the input to this job. Leaves out wiped ones. |
| `inserted_after`, `inserted_before` | ISO 8601. |

A `job_id` from another project answers 400 `invalid_parameter`.

## Get a dataclip

Status: **Private**

```
GET /api/dataclips/:id
```

Tokens: personal access token of any project member. The service account is
refused 403 `forbidden`: a dataclip's body is data that passed through a run.

```json
{
  "data": {
    "type": "dataclips",
    "id": "…",
    "attributes": {
      "name": null,
      "type": "step_result",
      "project_id": "…",
      "wiped_at": null,
      "inserted_at": "…",
      "updated_at": "…",
      "body": { "data": {} }
    },
    "relationships": {},
    "links": { "self": "https://.../api/dataclips/…" }
  },
  "included": [],
  "links": { "self": "https://.../api/dataclips/…" }
}
```

`type` is `http_request`, `global`, `step_result`, `saved_input` or `kafka`.
For `http_request` and `kafka`, `body` is `{"data": …, "request": …}`. Once a
dataclip has been wiped, under the project's retention policy or because the
project doesn't save dataclips, `wiped_at` is set and the body's contents are
`null`. The values of credentials and webhook auth methods that could have
reached the body are scrubbed out of it. An unknown or malformed id answers
403 `forbidden`; see [who hears 404](./errors.md#who-hears-404).

## Rename a dataclip

Status: **Private**

```
PATCH /api/dataclips/:id
```

Tokens: personal access token of a project owner, admin or editor. The service
account is refused 403 `forbidden`.

Body: `{"name": "<string or null>"}`. A name saves the dataclip so the
retention policy doesn't wipe it, and `null` removes the name. A body without
`name` changes nothing. Answers 200 with the dataclip, as for getting one.

A name is at most 255 characters. One another dataclip in the project has
answers 422 `invalid` with a `taken` entry at `#/name`. Any other key is an
`unknown_key` entry in the same 422. 409 `concurrent_edit` when the dataclip is
deleted while it is renamed.

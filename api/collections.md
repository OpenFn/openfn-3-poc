# Collections

A collection is a named key-value store inside a project. There are two APIs:
one manages the collection itself, the other reads and writes its items.

## Get a collection

Status: **Public**

```
GET /api/projects/:project_id/collections/:id
```

Tokens: personal access token of a project owner or admin, or service account
with `collections:write`.

```json
{ "data": { "id": "…", "project_id": "…", "name": "patients" } }
```

Notable errors:

- 403 `forbidden` to a caller who isn't an owner or admin of the project, or
  hasn't met its MFA requirement, whatever the ids.
- 404 `not_found` for an id that names no collection in the project, and 400
  `invalid_parameter` for one that isn't a UUID, to a caller the project
  allows. For a `project_id` that names no project or isn't a UUID, only a
  superuser and the service account hear these.
- 409 `scheduled_for_deletion` when the project is being deleted, to a caller
  the project would otherwise allow.

Planned additional scope: `byte_size_sum`, the bytes the collection's keys and
values take up, which is what counts against the plan's storage limit.

## Create or rename a collection

Status: **Public**

```
PUT /api/projects/:project_id/collections/:id
```

Tokens: personal access token of a project owner or admin, or service account
with `collections:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. Lowercase letters and digits, separated by `-`, `_` or `.`. |
| `id` | UUID | Optional. Must match the path if sent. |

Creates the collection under `:id`, or renames the one that has it and keeps
its items. Answers 201 on create and 200 on rename, with the same shape as
`GET`.

Notable errors:

- 409 `id_taken` when the id belongs to a collection in another project,
  even one you can't see.
- 422 `invalid` with a `taken` entry at `#/name` when the name is already used
  in the project.
- 402 `exceeds_limit` when creating would go over the plan's limit. A body
  that is also invalid answers 422 instead.
- 409 `concurrent_edit` when another request deletes the collection while
  this one renames it.

Planned additional scope: a superuser's personal access token, and moving a
collection to another project by sending its `id` under the new project's
path, instead of answering 409 `id_taken`. Lightning can't do this today:
the project picker on the superuser page at `/settings/collections` is
disabled when editing, and `Lightning.Collections.update_collection/3` casts
only the name.

## List a project's collections

Status: **Private**

```
GET /api/projects/:project_id/collections
```

Tokens: personal access token of a project owner or admin, or service account
with `collections:write`. Paged.

| Parameter | Notes |
| --- | --- |
| `sort` | `name` (the default) or `byte_size_sum`, with a `-` prefix for descending. |

Each collection has `byte_size_sum`, the bytes its keys and values take up.

```json
{
  "data": [{ "id": "…", "project_id": "…", "name": "patients", "byte_size_sum": 20480 }],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

> Implementation note: `Lightning.Collections.list_project_collections/2`,
> which the project settings Collections tab
> (`LightningWeb.ProjectLive.CollectionsComponent`) calls on load and on its
> `sort` event. It returns whole collection records, `byte_size_sum`
> included, and takes `order_by`, which the tab sets to `name` or
> `byte_size_sum` in either direction. Differences: it isn't paged.

## List every collection

Status: **Private**

```
GET /api/collections
```

Tokens: personal access token of a superuser, or service account with
`collections:write`. Paged.

Lists the collections of every project on the instance, in the same shape as
the project list, with `project_name` added. Takes the same `sort`.

> Implementation note: `Lightning.Collections.list_collections/1`, which the
> superuser page at `/settings/collections` (`LightningWeb.CollectionLive.Index`)
> calls on mount and on its `sort` event. It preloads `:project`, so the
> project name is there, and takes `order_by`, which the page sets to `name`
> or `byte_size_sum` in either direction. Differences:
>
> - it isn't paged.
> - it does no authorisation check. The page is limited to superusers by the
>   `:ensure_admin` hook (`:access_admin_space` in `Lightning.Policies.Users`),
>   so the route has to check the token itself.

## Delete a collection

Status: **Private**

```
DELETE /api/projects/:project_id/collections/:id
```

Tokens: personal access token of a project owner or admin, or service account
with `collections:write`.

Deletes the collection and every item in it. Answers 204 with no body.

> Implementation note: `Lightning.Collections.delete_collection/1` takes only
> the collection id. Differences: it takes no actor, so it records no audit
> event, and it doesn't check the collection belongs to the path's project.
> The route has to do both.

## Collection items

These routes address a collection by name. If more than one project you can
see has a collection with that name, add `?project_id=…`, or you get 409
`ambiguous_name`. A name that no project you can see holds answers 404
`not_found`, as does a `project_id` that isn't a UUID. Unlike the rest of the
API, these routes answer 404 rather than 403 for what you can't see.

Tokens: personal access token or run token. A run can only reach its own
project's collections. With a personal access token, reading needs any role in
the project, writing needs editor or above, and deleting many items at once
needs owner or admin. A caller who can see the collection but lacks the role,
or hasn't met the project's MFA requirement, gets 403 `forbidden`. A service
account or GitHub sync token answers 401 `invalid_token`. Service account
support is planned.

Writes that would go over the plan's storage limit answer 402 `exceeds_limit`.
A project being deleted answers 409 `scheduled_for_deletion` to its members.

An item looks like this. `value` is always a string; store JSON by encoding it
yourself.

```json
{ "key": "patient-001", "value": "{\"age\": 42}", "created": "…", "updated": "…" }
```

### Get one item

Status: **Public**

```
GET /collections/:name/:key
```

Answers 200 with the item, or 204 with no body if the key doesn't exist.

### Stream items

Status: **Public**

```
GET /collections/:name
```

| Parameter | Notes |
| --- | --- |
| `key` | A key pattern to match. `*` is a wildcard, for example `patient-*`. |
| `limit` | Items to return. Defaults to the instance's stream limit. |
| `cursor` | The `cursor` from the previous response, to get the next batch. |
| `created_after`, `created_before` | ISO 8601 timestamps. |
| `updated_after`, `updated_before` | ISO 8601 timestamps. |
| `project_id` | Only to pick between collections with the same name. |

Any other parameter answers 400 `invalid_parameter` with an `unknown_key`
entry.

```json
{ "items": [ { "key": "…", "value": "…", "created": "…", "updated": "…" } ], "cursor": "MTIz" }
```

`cursor` is `null` when there are no more items.

> Implementation note: the Download button on the project settings
> Collections tab uses the session-cookie route
> `GET /download/collections/:project_id/:name`
> (`LightningWeb.CollectionDownloadController.download/2`), authorised by
> `:access_collection` like this one. It sends every item as one JSON array,
> as a file named `<name>.json`. There is no API route for that; page through
> this route with `cursor` and build the file instead.

### Put one item

Status: **Public**

```
PUT /collections/:name/:key
```

Body: `{"value": "<string>"}`. Answers `{"upserted": 1, "error": null}`. A
value Lightning can't store answers 422 `invalid`, writing nothing, with an
entry at `#/value`: `required` when it is missing, `type` when it isn't a
string, or `too_long` over 1,000,000 characters. A key over 255 characters
adds a `too_long` entry with `path` `key`. Lightning used to answer these 200
with `{"upserted": 0}`. A body that isn't a JSON object answers 400
`malformed`.

### Put many items

Status: **Public**

```
POST /collections/:name
```

Body: `{"items": [{"key": "…", "value": "…"}, …]}`. Answers
`{"upserted": <count>, "error": null}`. If any item is invalid, nothing is
written and the 422 has an entry for each bad item, for example
`#/items/3/key` with `duplicate` for a key that appears twice. A missing
`items` is a `required` entry at `#/items`. A body that isn't a JSON object
answers 400 `malformed`.

### Delete one item

Status: **Public**

```
DELETE /collections/:name/:key
```

Answers `{"key": "<key>", "deleted": 1}`, or `"deleted": 0` if the key didn't
exist.

### Delete many items

Status: **Public**

```
DELETE /collections/:name
DELETE /collections/:name?key=patient-*
```

Without `key`, deletes every item. With `key`, deletes the items matching the
pattern. Answers `{"key": <pattern or null>, "deleted": <count>}`.

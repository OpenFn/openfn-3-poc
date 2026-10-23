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

- 409 `id_taken` when the id belongs to a collection in another project.
- 409 `taken` when the name is already used in the project.
- 402 `exceeds_limit` when creating would go over the plan's limit.

## List a project's collections

Status: **Private**

```
GET /api/projects/:project_id/collections
```

Tokens: personal access token of a project owner or admin, or service account
with `collections:write`. Paged.

```json
{
  "data": [{ "id": "…", "project_id": "…", "name": "patients" }],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

> Implementation note: `Lightning.Collections.list_project_collections/2`.
> Differences: it isn't paged.

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
`ambiguous_name`.

Tokens: personal access token or run token. A run can only reach its own
project's collections. With a personal access token, reading needs any role in
the project, writing needs editor or above, and deleting many items at once
needs owner or admin. Service account support is planned.

Writes that would go over the plan's storage limit answer 402 `exceeds_limit`.

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

### Put one item

Status: **Public**

```
PUT /collections/:name/:key
```

Body: `{"value": "<string>"}`. Answers `{"upserted": 1, "error": null}`. A
missing or invalid value answers 422.

### Put many items

Status: **Public**

```
POST /collections/:name
```

Body: `{"items": [{"key": "…", "value": "…"}, …]}`. Answers
`{"upserted": <count>, "error": null}`. If any item is invalid, nothing is
written and the 422 has an entry for each bad item, for example
`#/items/3/key` with `duplicate` for a key that appears twice.

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

# Credentials

Credential bodies (the secrets) are never returned by any endpoint.

## The credential object

```json
{
  "id": "c0ffee00-1234-4abc-8def-0123456789ab",
  "name": "Acme DHIS2",
  "schema": "raw",
  "external_id": null,
  "user_id": "604f0cd2-37fb-4833-a5e1-821555b5b314",
  "project_credentials": [
    {
      "id": "…",
      "project_id": "a1b2c3d4-…",
      "credential_id": "c0ffee00-…",
      "inserted_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ],
  "projects": [
    { "id": "a1b2c3d4-…", "name": "malaria-programme", "description": "…" }
  ],
  "inserted_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-01T00:00:00Z"
}
```

Links to projects you can't see are left out. A service account token without
`projects:write` sees every link, but `projects` is empty.

## Get a credential

Status: **Public**

```
GET /api/credentials/:id
```

Tokens: personal access token, or service account with `credentials:write`.

Returns `{"credential": <credential>}`. You can see a credential if you own it
or it is linked to a project whose credentials you may list. Anyone else gets
404. A service account with `credentials:write` can see every credential.

## Create or replace a credential

Status: **Public**

```
PUT /api/credentials/:id
```

Tokens: personal access token, or service account with `credentials:write`.

Creates the credential under `:id`, or replaces the name, schema and `main`
body of the credential that has it.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique among the owner's credentials. |
| `schema` | string | The credential type, for example `raw`, `http` or `dhis2`. The body is checked against it. |
| `owner` | string (email) | A service account must name an existing user. A person may only name themselves, or leave it out. |
| `credential_bodies` | array | Exactly one entry: `{"name": "main", "body": {…}}`, where `body` is an object. |
| `project_credentials` | array of `{project_id}` | Optional. Projects to link. Links are only ever added; links the credential already has stay even if you leave them out. |
| `id` | UUID | Optional. Must match the path if sent. |

```bash
curl -X PUT https://lightning.example.org/api/credentials/$CREDENTIAL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme DHIS2",
    "schema": "raw",
    "owner": "ada@example.com",
    "credential_bodies": [
      {"name": "main", "body": {"username": "admin", "password": "district"}}
    ],
    "project_credentials": [{"project_id": "'"$PROJECT_ID"'"}]
  }'
```

Answers 201 `{"credential": <credential>}` when it creates one, 200 when it
replaces one.

Notable errors:

- 409 `id_taken` when the id belongs to a credential with a different owner,
  or one you can't edit. Lightning never moves a credential between owners.
- 409 `scheduled_for_deletion` when the credential is being deleted.
- 403 `forbidden` when a person names an owner other than themselves. This is
  answered the same way whether or not the email has an account.
- 409 `taken` when the owner already has a credential with this name.
- 422 `invalid` with entries such as `not_found` at `#/owner`, `one_body` at
  `#/credential_bodies`, or `not_found` or `no_access` at
  `#/project_credentials/N/project_id` (the owner isn't a member of that
  project, or you can't link credentials there).
- 503 `not_ready` with `Retry-After` when Lightning can't check the schema yet.

## List credentials

Status: **Public**

```
GET /api/credentials
GET /api/credentials?project_id=:project_id
GET /api/projects/:project_id/credentials
```

Tokens: personal access token. Service account support is planned.

Without a project, lists your own credentials. With a project, lists every
credential linked to it, whoever owns it. Returns
`{"credentials": [<credential>, …]}`. Not paged.

## Create a credential (owned by you)

Status: **Public**

```
POST /api/credentials
```

Tokens: personal access token.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. |
| `credential_bodies` | array of `{name, body}` | The secret values, for example `[{"name": "main", "body": {…}}]`. |
| `schema` | string | Required. The credential type. |
| `project_credentials` | array of `{project_id}` | Optional. You must be an editor or above on each project. |

Answers 201 `{"credential": <credential>}`. Lightning picks the id. Prefer
`PUT` if you need to retry safely.

## Delete a credential

Status: **Public**

```
DELETE /api/credentials/:id
```

Tokens: personal access token. Only the owner can delete. Service account
support is planned.

Answers 204 with no body. A credential that has been used by runs answers 409
`in_use`. Someone who can see the credential but doesn't own it gets 403.

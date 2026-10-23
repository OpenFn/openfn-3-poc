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

Planned additional scope: `scheduled_deletion` (a timestamp, or `null`),
`transfer_status` (`pending`, `completed` or `null`) and `environments` (the
names of its environments, such as `[{"name": "main"}]`).

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

Planned additional scope:

- Credentials with environments other than `main`, set through
  [the environment routes](#list-a-credentials-environments). A replace leaves
  the other environments as they are.
- For an `oauth` credential, a body without `refresh_token` keeps the stored
  one, so a client doesn't have to hold it.

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

To delete a credential that has been used, schedule its deletion instead
(below).

## Schedule a credential's deletion

Status: **Planned**

```
PUT /api/credentials/:id/scheduled_deletion
```

Tokens: personal access token of the owner, or service account with
`credentials:write`.

No body. Unlinks the credential from every project straight away, so jobs using
it stop getting it, and revokes any OAuth tokens at the provider. Lightning
empties its bodies after the instance's retention period, and deletes it then
unless runs have used it. Until then every other route on the credential
answers 409 `scheduled_for_deletion`. Answers 200 with the credential.
Scheduling one that is already scheduled changes nothing.

This differs from projects, where `DELETE` schedules, because
`DELETE /api/credentials/:id` already deletes at once.

## Cancel a credential's deletion

Status: **Planned**

```
DELETE /api/credentials/:id/scheduled_deletion
```

Tokens: as for scheduling.

Answers 200 with the credential. The project links removed when it was
scheduled are not restored. A credential that isn't scheduled answers 404
`not_found`.

## Link a credential to a project

Status: **Planned**

```
PUT /api/projects/:project_id/credentials/:id
```

Tokens: personal access token of the credential's owner who is an editor or
above in the project, or service account with `credentials:write`.

No body. Links the credential to the project and to the project's sandboxes.
Answers 201 with the credential when it links, and 200 if it was already
linked.

Notable errors:

- 422 `invalid` with a `no_access` entry at `path` `project_id` when the owner
  isn't a member of the project.
- 409 `taken` when another credential linked to the project has the same
  `external_id`.

## Unlink a credential from a project

Status: **Planned**

```
DELETE /api/projects/:project_id/credentials/:id
```

Tokens: personal access token of the credential's owner, or of a project owner
or admin, or service account with `credentials:write`.

Jobs in the project that use the credential lose it. Links to the project's
sandboxes stay. Answers 204 with no body. A credential that isn't linked
answers 404 `not_found`. To see which workflows would lose it first, use
`GET /api/workflows?credential_id=:id&project_id=:project_id`.

## Credential environments

A credential has a body per environment, such as `main` and `staging`, so a
project and its sandboxes can use different secrets. It has between one and
five. Bodies are never returned.

### List a credential's environments

Status: **Planned**

```
GET /api/credentials/:id/environments
```

Tokens: personal access token of the owner, or service account with
`credentials:write`.

```json
{ "data": [{ "name": "main", "inserted_at": "…", "updated_at": "…" }] }
```

### Set an environment

Status: **Planned**

```
PUT /api/credentials/:id/environments/:name
```

Tokens: as for listing.

Body: `{"body": {…}}`, checked against the credential's `schema`. Creates the
environment or replaces its body. A name is lowercase letters, digits, `-`
and `_`, starting with a letter or digit, at most 32 characters. Answers 201
when it creates and 200 when it replaces, with the environment.

Notable errors: 422 `invalid` with an `exceeds_limit` entry at `path` `name`
for a sixth environment, or `too_many_secrets` at `#/body`.

### Delete an environment

Status: **Planned**

```
DELETE /api/credentials/:id/environments/:name
```

Tokens: as for listing.

Answers 204 with no body. Deleting the last environment answers 422 `invalid`
with a `required` entry at `path` `name`.

## Transfer a credential

A credential can be given to another user. The owner starts a transfer, then
confirms it from an email.

### Start a transfer

Status: **Planned**

```
PUT /api/credentials/:id/transfer
```

Tokens: personal access token of the owner.

Body: `{"recipient": "grace@example.com"}`. The recipient must be a member of
every project the credential is linked to. Lightning emails the owner a link to
confirm, and ownership moves once they follow it. Answers 200 with the
credential, `transfer_status` `pending`. Starting the same transfer again
changes nothing.

Notable errors:

- 422 `invalid` with a `not_found` entry at `#/recipient` when no user has the
  email, or `no_access` when they aren't a member of every linked project.
- 501 `not_implemented` when the instance doesn't allow transfers.

### Cancel a transfer

Status: **Planned**

```
DELETE /api/credentials/:id/transfer
```

Tokens: personal access token of the owner.

Answers 200 with the credential. A credential with no pending transfer answers
404 `not_found`.

## OAuth clients

An OAuth client holds the app registration (client id and secret, endpoints and
scopes) that `oauth` credentials use to get tokens. Its owner can link it to
projects, and a superuser can make it global, which lists it in every project.
`client_secret` is never returned.

```json
{
  "id": "…",
  "name": "Google Sheets",
  "client_id": "1234.apps.googleusercontent.com",
  "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "revocation_endpoint": "https://oauth2.googleapis.com/revoke",
  "userinfo_endpoint": null,
  "introspection_endpoint": null,
  "scopes_doc_url": null,
  "mandatory_scopes": "openid,email",
  "optional_scopes": "https://www.googleapis.com/auth/spreadsheets",
  "global": false,
  "user_id": "…",
  "project_ids": ["…"],
  "inserted_at": "…",
  "updated_at": "…"
}
```

### List OAuth clients

Status: **Planned**

```
GET /api/oauth_clients
GET /api/projects/:project_id/oauth_clients
```

Tokens: personal access token, or service account with `credentials:write`.

Without a project, lists your own clients and the global ones. With a project,
lists the clients linked to it and the global ones. Paged.

### Create or replace an OAuth client

Status: **Planned**

```
PUT /api/oauth_clients/:id
```

Tokens: personal access token, or service account with `credentials:write`.
Replacing needs the owner.

Takes the fields above except `user_id`, plus `client_secret`.
`name`, `client_id`, `client_secret`, `authorization_endpoint` and
`token_endpoint` are required on create; leave `client_secret` out of a replace
to keep it. Endpoints must be URLs. `global` needs a superuser. Linking a
project needs editor or above in it. Answers 201 on create and 200 on replace.

### Delete an OAuth client

Status: **Planned**

```
DELETE /api/oauth_clients/:id
```

Tokens: personal access token of the owner, or service account with
`credentials:write`.

Answers 204 with no body. Credentials that used the client stay, but can't get
new tokens until they are given another client.

## Keychain credentials

A keychain credential picks one of a project's credentials for each run, by
reading a value from the run's input with a JSONPath. It belongs to the
project, not to a person.

```json
{
  "id": "…",
  "project_id": "…",
  "name": "Per-district DHIS2",
  "path": "$.district",
  "default_credential_id": "…",
  "inserted_at": "…",
  "updated_at": "…"
}
```

### List a project's keychain credentials

Status: **Planned**

```
GET /api/projects/:project_id/keychain_credentials
```

Tokens: personal access token of a project owner or admin, or service account
with `credentials:write`. Paged.

### Create or replace a keychain credential

Status: **Planned**

```
PUT /api/projects/:project_id/keychain_credentials/:id
```

Tokens: as for listing.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. At most 255 characters. |
| `path` | string | Required. A JSONPath starting with `$`. At most 500 characters. |
| `default_credential_id` | UUID | Optional. Used when the path matches nothing. Must be linked to the project. |

Answers 201 on create and 200 on replace.

### Delete a keychain credential

Status: **Planned**

```
DELETE /api/projects/:project_id/keychain_credentials/:id
```

Tokens: as for listing.

Answers 204 with no body. Jobs that used it are left without a credential.

## Credential schemas

A schema describes the body of one type of credential. `PUT
/api/credentials/:id` checks bodies against the credential's `schema`.

### List credential schemas

Status: **Planned**

```
GET /api/credential_schemas
```

Tokens: personal access token, or service account with `credentials:write`.

```json
{ "data": [{ "name": "dhis2", "title": "DHIS2" }, { "name": "raw", "title": "Raw JSON" }] }
```

### Get a credential schema

Status: **Planned**

```
GET /api/credential_schemas/:name
```

Tokens: as for listing.

Answers 200 with `{"data": {"name": …, "title": …, "schema": {…}}}`, where
`schema` is a JSON Schema. `raw` has none, since it takes any object. Names are
not UUIDs; an unknown name answers 404 `not_found`.

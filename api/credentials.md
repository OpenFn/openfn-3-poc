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

Planned additional scope: `scheduled_deletion` (a timestamp, or `null`) and
`transfer_status` (`pending`, `completed` or `null`), built on
`full-api-test`, not merged yet. Also `environments` (the names of its
environments, such as `[{"name": "main"}]`), `owner` (`id` and `email`, which
the credentials lists show), and `has_activity_in_projects` (`true` once any run step has used it, which decides whether it can still be
deleted outright). For an `oauth` credential, `oauth`: `oauth_client_id` and
the client's `name` (the type the lists show), the `scopes` granted,
`expires_at`, and
`reauthorization_required` when the provider has refused its refresh token and
the owner must connect it again in the app. Reading it never refreshes the
token.

## Get a credential

Status: **Public**

```
GET /api/credentials/:id
```

Tokens: personal access token, or service account with `credentials:write`.

Returns `{"credential": <credential>}`. You can see a credential if you own it
or it is linked to a project whose credentials you may list. Anyone else gets
403 `forbidden`, whether or not it exists or the id is a UUID. A service
account with `credentials:write` can see every credential, so only it hears
404 `not_found` for an unknown id and 400 `invalid_parameter` for one that
isn't a UUID.

A credential scheduled for deletion can still be read.

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

Only the owner and a service account may replace a credential. An id that
isn't a UUID answers 400 `invalid_parameter` to anyone, since anyone may
create one.

Notable errors:

- 403 `forbidden` when the id belongs to a credential you may not edit, even
  one you can see through a project.
- 409 `scheduled_for_deletion` when the credential is scheduled for deletion.
- 403 `forbidden` when a person names an owner other than themselves. This is
  answered the same way whether or not the email has an account.
- 422 `invalid` with entries such as `taken` at `#/name` when the owner
  already has a credential with this name, `not_allowed` at `#/owner` when a
  replace names a different owner (Lightning never moves a credential between
  owners), `not_found` at `#/owner`, `required` at `#/owner` when a service
  account leaves it out, `one_body` at `#/credential_bodies`, `mismatch` at
  `#/id`, `unknown_key` for a field not listed above, or `not_found` or `no_access` at
  `#/project_credentials/N/project_id` (the owner isn't a member of that
  project, or you can't link credentials there).
- 503 `not_ready` with `Retry-After` when Lightning can't check the schema yet.

Planned additional scope:

- Credentials with environments other than `main`, set through
  [the environment routes](#list-a-credentials-environments). A replace leaves
  the other environments as they are (built on `full-api-test`, not merged
  yet).
- For an `oauth` credential, a body without `refresh_token` keeps the stored
  one, so a client doesn't have to hold it.

## List credentials

Status: **Public**

```
GET /api/credentials
GET /api/credentials?project_id=:project_id
GET /api/projects/:project_id/credentials
```

Tokens: personal access token, or service account with `credentials:write`.
A service account must name a project; without one it gets 403 `forbidden`.

Without a project, lists your own credentials. With a project, lists every
credential linked to it, whoever owns it; you need a role in the project, or
support access to it. Returns `{"credentials": [<credential>, …], "links": …}`.
Paged, by name.

## Create a credential (owned by you)

Status: **Public**

```
POST /api/credentials
```

Tokens: personal access token. A service account gets 403 `forbidden`; it
creates through `PUT`, naming an owner.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. |
| `credential_bodies` | array of `{name, body}` | The secret values, for example `[{"name": "main", "body": {…}}]`. |
| `schema` | string | Required. The credential type. |
| `project_credentials` | array of `{project_id}` | Optional. You must be an editor or above on each project. |

Answers 201 `{"credential": <credential>}`. Lightning picks the id. Prefer
`PUT` if you need to retry safely. A name you already hold answers 422
`invalid` with a `taken` entry at `#/name`, and it answers 503 `not_ready`
while Lightning can't check the schema yet.

## Delete a credential

Status: **Public**

```
DELETE /api/credentials/:id
```

Tokens: personal access token. Only the owner can delete, so a service
account gets 403 `forbidden`. This is by design: a service account
[schedules the deletion](#schedule-a-credentials-deletion) instead, which can
be cancelled until the retention period ends.

Answers 204 with no body. Anyone who doesn't own the credential gets 403
`forbidden`, whether or not it exists or the id is a UUID; nobody hears 404.
This also deletes a credential that is scheduled for deletion, which is the
app's "Delete now".

A credential that has been used by runs (`has_activity_in_projects`) can't be
deleted, and answers 409 `in_use`. `Lightning.Credentials.delete_credential/2`
checks `has_activity_in_projects?/1` first, which is also what the app asks
before offering "Delete now".

To delete a credential that has been used, schedule its deletion instead
(below).

## Schedule a credential's deletion

Status: **Private**

```
PUT /api/credentials/:id/scheduled_deletion
```

Tokens: personal access token of the owner, or service account with
`credentials:write`.

No body; any key answers 422 `invalid` with an `unknown_key` entry. Unlinks the
credential from every project straight away, so jobs using it stop getting it,
revokes any OAuth tokens at the provider and emails the owner. Lightning
empties its bodies after the instance's retention period, and deletes it then
unless runs have used it. Answers 200 with the credential. Scheduling one that
is already scheduled answers the same and changes nothing: the date doesn't
move and the owner isn't emailed again.

Until then, the routes that change the credential answer 409
`scheduled_for_deletion`: replacing it, its environments, linking it and
transferring it. It can still be read, deleted at once, and its deletion
cancelled.

Only the service account hears 404 `not_found` for an unknown id and 400
`invalid_parameter` for one that isn't a UUID. Anyone else who isn't the owner
gets 403 `forbidden`.

This differs from projects, where `DELETE` schedules, because
`DELETE /api/credentials/:id` already deletes at once.

## Cancel a credential's deletion

Status: **Private**

```
DELETE /api/credentials/:id/scheduled_deletion
```

Tokens: as for scheduling.

Answers 200 with the credential. The project links removed when it was
scheduled are not restored. A credential that isn't scheduled answers 404
`not_found`. Who hears 404 for the id is as for scheduling.

## Link a credential to a project

Status: **Private**

```
PUT /api/projects/:project_id/credentials/:id
```

Tokens: personal access token of the credential's owner who is an editor or
above in the project, or service account with `credentials:write`.

No body; any key answers 422 `invalid` with an `unknown_key` entry. Links the
credential to the project and to the project's sandboxes. Answers 201 with the
credential when it links, and 200 if it was already linked.

The credential isn't in the project until it is linked, so only the service
account hears 404 `not_found` or 400 `invalid_parameter` for its id. Anyone
else permitted on the project gets 403 `forbidden`.

Notable errors:

- 409 `scheduled_for_deletion` when the project or the credential is
  scheduled for deletion.
- 422 `invalid` with a `no_access` entry at `path` `project_id` when the owner
  isn't a member of the project.
- 422 `invalid` with a `taken` entry at `path` `id` when another credential
  linked to the project has the same `external_id`.

## Unlink a credential from a project

Status: **Private**

```
DELETE /api/projects/:project_id/credentials/:id
```

Tokens: personal access token of the credential's owner, or of a project owner
or admin, or service account with `credentials:write`.

Jobs in the project that use the credential lose it. Links to the project's
sandboxes stay. Answers 204 with no body. A credential that isn't linked
answers 404 `not_found` to anyone who may list the project's credentials. To
see which workflows would lose it first, use
`GET /api/workflows?credential_id=:id&project_id=:project_id`.

## Credential environments

A credential has a body per environment, such as `main` and `staging`, so a
project and its sandboxes can use different secrets. It has between one and
five. Bodies are never returned.

All three routes take a personal access token of the owner, or a service
account with `credentials:write`. Only the service account hears 404
`not_found` for an unknown credential id and 400 `invalid_parameter` for one
that isn't a UUID; anyone else who isn't the owner gets 403 `forbidden`. A
credential scheduled for deletion answers 409 `scheduled_for_deletion`.

### List a credential's environments

Status: **Private**

```
GET /api/credentials/:id/environments
```

```json
{ "data": [{ "name": "main", "inserted_at": "…", "updated_at": "…" }] }
```

### Set an environment

Status: **Private**

```
PUT /api/credentials/:id/environments/:name
```

Body: `{"body": {…}}`, checked against the credential's `schema`. Creates the
environment or replaces its body. A name is lowercase letters, digits, `-`
and `_`, starting with a letter or digit, at most 32 characters. Answers 201
when it creates and 200 when it replaces, with `{"data": <environment>}`.

Notable errors:

- 422 `invalid` with an `exceeds_limit` entry at `path` `name` for a sixth
  environment, a `format` entry there for a name Lightning doesn't accept,
  `required` or `type` at `#/body` when the body is missing or isn't an
  object, `too_many_secrets` at `#/body`, or `unknown_key`.
- 503 `not_ready` with `Retry-After` when Lightning can't check the schema yet.

### Delete an environment

Status: **Private**

```
DELETE /api/credentials/:id/environments/:name
```

Answers 204 with no body. An environment the credential doesn't have answers
404 `not_found`. Deleting the last environment answers 422 `invalid` with a
`required` entry at `path` `name`.

## Transfer a credential

A credential can be given to another user. The owner starts a transfer, then
confirms it from an email.

Both routes take only the owner's personal access token, so a service account
gets 403 `forbidden`. Anyone but the owner gets 403 `forbidden` for every id,
an unknown one or one that isn't a UUID included. A credential scheduled for
deletion answers 409 `scheduled_for_deletion`.

### Start a transfer

Status: **Private**

```
PUT /api/credentials/:id/transfer
```

Body: `{"recipient": "grace@example.com"}`. The recipient must be a member of
every project the credential is linked to. Lightning emails the owner a link to
confirm, and ownership moves once they follow it. Answers 200 with the
credential, `transfer_status` `pending`. Starting again while a transfer is
pending signs a new link and emails the owner again, since Lightning keeps no
record of whom a pending transfer is for.

Notable errors:

- 422 `invalid` with an entry at `#/recipient`: `not_found` when no user has
  the email, `no_access` when they aren't a member of every linked project,
  `not_allowed` when it is you, `format` for something that isn't an email,
  `required` when it is missing, or `type` when it isn't a string. Other keys
  answer `unknown_key`.
- 501 `not_implemented` when the instance doesn't allow transfers. This is
  checked before the credential, so a caller who isn't the owner hears it too.

### Cancel a transfer

Status: **Private**

```
DELETE /api/credentials/:id/transfer
```

Answers 200 with the credential. A credential with no pending transfer answers
404 `not_found`.

Cancelling doesn't invalidate the link already emailed. If the owner starts
another transfer before that link expires, the old link works again and
transfers to its first recipient.

## OAuth clients

An OAuth client holds the app registration (client id and secret, endpoints and
scopes) that `oauth` credentials use to get tokens. Its owner can link it to
projects, and a superuser can make it global, which lists it in every project.
`client_secret` is never returned. `mandatory_scopes` and `optional_scopes` are
comma-separated strings, as Lightning stores them; the credential form splits
them on commas into the scope checkboxes, with the mandatory ones always
selected.

A client belongs to the person who created it. A service account can't own
one, so it can only list a project's clients.

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

`project_ids` leaves out projects whose credentials you may not list.

### List OAuth clients

Status: **Private**

```
GET /api/oauth_clients
GET /api/projects/:project_id/oauth_clients
```

Tokens: personal access token. With a project, also a service account with
`credentials:write`; without one, a service account gets 403 `forbidden`.

Without a project, lists your own clients and the global ones. With a project,
lists the clients linked to it and the global ones; you need a role in the
project, or support access to it. Returns `{"data": [<client>, …], "links": …}`.
Paged, by name.

### Create or replace an OAuth client

Status: **Private**

```
PUT /api/oauth_clients/:id
```

Tokens: personal access token. A service account gets 403 `forbidden`.
Replacing needs the owner; anyone else gets 403 `forbidden`.

Takes the fields above except `user_id`, `inserted_at` and `updated_at`, plus
`client_secret`. `name`, `client_id`, `client_secret`,
`authorization_endpoint` and `token_endpoint` are required on create.
Endpoints and `scopes_doc_url` must be URLs. A replace empties every field the
body leaves out, except `client_secret`, which it keeps, and `global`.
`project_ids` is the client's whole list of links among the projects you can
see: links you leave out are removed, and links to projects you can't see
stay. Linking a project needs editor or above in it. Answers 201
`{"data": <client>}` on create and 200 on replace.

Notable errors:

- 400 `invalid_parameter` when the id isn't a UUID.
- 422 `invalid` with `not_allowed` at `#/global` when someone other than a
  superuser changes it, `not_found` or `no_access` at `#/project_ids/N`,
  `mismatch` at `#/id`, `unknown_key`, or the field rules above.

### Delete an OAuth client

Status: **Private**

```
DELETE /api/oauth_clients/:id
```

Tokens: personal access token of the owner. Anyone else, a service account
included, gets 403 `forbidden` for every id; nobody hears 404.

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
  "default_credential_name": "Acme DHIS2",
  "created_by": { "id": "…", "email": "ada@example.com" },
  "inserted_at": "…",
  "updated_at": "…"
}
```

### List a project's keychain credentials

Status: **Private**

```
GET /api/projects/:project_id/keychain_credentials
```

Tokens: personal access token of any project member, as the app shows the
list to every member, or service account with `credentials:write`. Returns
`{"data": [<keychain credential>, …], "links": …}`. Paged.

### Create or replace a keychain credential

Status: **Private**

```
PUT /api/projects/:project_id/keychain_credentials/:id
```

Tokens: personal access token of a project owner or admin, or of a support
user where the project allows support access, or service account with
`credentials:write`. A keychain credential records who created it, so a
service account may replace one but not create one; creating answers 403
`forbidden`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Unique within the project. At most 255 characters. |
| `path` | string | Required. A JSONPath starting with `$`. At most 500 characters. |
| `default_credential_id` | UUID | Optional. Used when the path matches nothing. Must be linked to the project. A replace that leaves it out clears it. |
| `id` | UUID | Optional. Must match the path if sent. |

Answers 201 `{"data": <keychain credential>}` on create and 200 on replace.

Notable errors:

- 409 `id_taken` when the id belongs to a keychain credential in another
  project.
- 422 `invalid` with `taken` at `#/name`, `format` at `#/path`, `not_found` at
  `#/default_credential_id` when that credential isn't linked to the project,
  `required`, `too_long`, `mismatch` at `#/id`, or `unknown_key`.

### Delete a keychain credential

Status: **Private**

```
DELETE /api/projects/:project_id/keychain_credentials/:id
```

Tokens: a project owner or admin, a support user where the project allows
support access, or service account with `credentials:write`.

Answers 204 with no body. Jobs that used it are left without a credential.

## Credential schemas

A schema describes the body of one type of credential. `PUT
/api/credentials/:id` checks bodies against the credential's `schema`.

### List credential schemas

Status: **Private**

```
GET /api/credential_schemas
```

Tokens: personal access token, or service account with `credentials:write`.

```json
{ "data": [{ "name": "raw", "title": "Raw JSON" }, { "name": "@openfn/language-dhis2", "title": "dhis2" }] }
```

Lists `raw`, then every adaptor that has a credential schema, by name. It
leaves out `@openfn/language-googlesheets` and `@openfn/language-gmail`, which
connect through OAuth. A schema's name is its adaptor's package name, and its
`title` is the short name. Short names such as `dhis2` are accepted where a
schema is named, and stored in full. Answers 503 `not_ready` with
`Retry-After` before the adaptor catalogue first loads.

Planned additional scope: a display title, such as `DHIS2`.

### Get a credential schema

Status: **Private**

```
GET /api/credential_schemas/:name
```

Tokens: as for listing.

Answers 200 with `{"data": {"name": …, "title": …, "schema": {…}}}`, where
`schema` is a JSON Schema and `name` is the full package name, even when you
asked by short name. `raw` takes any object, so its `schema` is `null`. A
package name holds a `/`, so encode it in the path. Names are not UUIDs; an
unknown name, and `oauth`, answer 404 `not_found`. Answers 503 `not_ready` as
listing does.

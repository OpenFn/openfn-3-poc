# Errors

Every error from the API (except the token endpoint, see [Authentication](./authentication.md)) is an
[RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) problem document:

```json
{
  "type": "about:blank",
  "status": 400,
  "title": "Bad Request",
  "code": "invalid_parameter",
  "detail": "A path or query parameter is not valid. See errors.",
  "errors": [{ "path": "id", "code": "type", "detail": "is not a UUID" }]
}
```

- Branch on `code`. It is stable, and each code always comes with the same
  status (except `exceeds_limit`, which webhooks send as 429). `title` and
  `detail` are for people and may change.
- `errors` appears only when the problem lies in particular parts of the
  request. Each entry has a `code`, a `detail` and exactly one location:
  `pointer` (a JSON pointer into the body, such as `#/members/0/email`),
  `parameter` (a query parameter's name), `header` (a request header's name, in
  lower case) or `path` (a path segment, named as in the route, such as `id` or
  `project_id`). Entries never quote a value you sent.
- The content type is `application/problem+json` when your `Accept` header
  names it, and `application/json` otherwise. The body is the same either way.
- Some problems carry extra members: `scope` on 403 `insufficient_scope`, and
  `work_order_id` on a synchronous webhook's errors once a work order exists.

## Order of checks

Lightning checks a request in a fixed order, and the first check that fails
answers. A body that can't be read at all (invalid JSON as 400 `malformed`, 413
or 415) is refused before any of these.

1. Authentication. A missing or bad token is 401, or 400 `invalid_request` for
   an `Authorization` header Lightning can't read. On `full-api-test` (not
   merged yet), a write on a session token without its `x-csrf-token` is 400
   `invalid_header` here.
2. Scope. A token without the scope the route needs is 403
   `insufficient_scope`, even if the id doesn't exist or the body is wrong.
3. Permission. A token kind the route isn't open to is 403 `forbidden`, and
   on `full-api-test` (not merged yet) a session that hasn't stepped up is 403
   `step_up_required`, both before anything is looked up. Then 501
   `not_implemented` for a feature the instance has turned off: credential
   transfers on an instance that doesn't allow them answer 501 before the
   credential is looked up, even to someone who isn't its owner. Then, if you
   may not do this to the project or record, it is 403
   `forbidden`, whether or not the record exists and whether or not the id is a
   UUID.
4. Project state. A project in the path that is scheduled for deletion is 409
   `scheduled_for_deletion`, whether or not the record under it exists.
5. The id. 400 `invalid_parameter` with a `path` entry if it isn't a UUID, 404
   `not_found` if no such record exists. A record in another project counts as
   missing.
6. Record state. A record that is itself scheduled for deletion is 409
   `scheduled_for_deletion`. An id held by a record at another URL is 409
   `id_taken`.
7. Parameters and body. A bad query parameter or header, or a body that isn't a
   JSON object, is 400. Then 503 `not_ready` if Lightning can't answer yet.
   Then every other problem with the body is reported together in one 422
   `invalid`. `concurrent_edit` comes only from the write, so a 422 beats it.
8. Plan limits. 402 `exceeds_limit` (429 on webhooks), asked only of a request
   that is otherwise valid.

A viewer's `PATCH` on a missing workflow is therefore 403, while their `GET` on
it is 404.

### Who hears 404

Only a caller who may learn which records exist hears 404 or 400 for an id.
Everyone else hears 403 `forbidden`.

| The id names | 404 and 400 go to |
| --- | --- |
| A record under `/api/projects/:project_id/` | Anyone with permission on the project |
| A project | Superusers and the service account |
| A workflow, job, run or work order at the top level | The service account |
| A credential, to read it | The service account |
| A credential, to schedule its deletion, change its environments or link it to a project (built on `full-api-test`, not merged yet) | The service account |
| A credential, to transfer it, or an OAuth client, to delete it (built on `full-api-test`, not merged yet) | Nobody |
| A user | The service account |

## Response codes

| Status | `code` | Meaning |
| --- | --- | --- |
| 400 | `bad_request` | The request could not be read. |
| 400 | `invalid_request` | The `Authorization` header is malformed: nothing after `Bearer`, whitespace inside the token, or the header sent twice. |
| 400 | `malformed` | The body is not valid JSON, or not a JSON object. |
| 400 | `invalid_parameter` | A path or query parameter is not valid, such as an id that isn't a UUID. `errors` names each one. |
| 400 | `invalid_header` | A request header is not valid. |
| 401 | `unauthenticated` | No `Authorization` header. |
| 401 | `invalid_token` | The token is expired or bad, or this route doesn't accept its kind. |
| 401 | `invalid_credentials` | Built on `full-api-test`, not merged yet. Signing in failed. The same for every reason, so it can't be used to find accounts. |
| 401 | `mfa_required` | Built on `full-api-test`, not merged yet. Signing in needs an MFA code too. |
| 402 | `exceeds_limit` | This would exceed a limit of your plan. |
| 403 | `forbidden` | You may not do this, or it might not exist. Also sent when the project requires MFA you haven't set up, and to a token kind the route isn't open to. |
| 403 | `insufficient_scope` | The token lacks the scope this route needs. `scope` in the body names it. |
| 403 | `step_up_required` | Built on `full-api-test`, not merged yet. The person must enter their password or an MFA code again first. See [session tokens](./authentication.md#session-tokens). |
| 403 | `trigger_disabled` | The webhook's trigger is disabled. |
| 404 | `not_found` | The record doesn't exist, or the route doesn't. Only sent to a caller who may learn which records exist. |
| 406 | `not_acceptable` | The resource can't be returned in the format you asked for. |
| 408 | `request_timeout` | The request body did not arrive in time. Listed in Lightning's codes, but its web server doesn't send it today. |
| 409 | `scheduled_for_deletion` | The project, credential or user is scheduled for deletion. |
| 409 | `id_taken` | A `PUT` names an id another project already holds, such as another project's collection or keychain credential. |
| 409 | `being_edited` | The workflow is open in the editor. |
| 409 | `concurrent_edit` | Another request changed or deleted this record. Fetch it again and retry. |
| 409 | `in_use` | The credential has been used by runs and can't be deleted. |
| 409 | `ambiguous_name` | More than one collection has this name. Add `project_id`. |
| 409 | `export_conflict` | Two items in this project export under the same key. Not sent on `main`, where a clash on `GET /api/provision/yaml` falls through to a 500. On `full-api-test` (not merged yet), the workflow template `PUT` and the repo connection `PUT` and sync send it; `GET /api/provision/yaml` still answers a 500. |
| 409 | `not_retryable` | Built on `full-api-test`, not merged yet. Retrying a run whose workflow was deleted, or an AI message that isn't a failed user message. |
| 409 | `superuser` | Built on `full-api-test`, not merged yet. A superuser can't be scheduled for deletion. Change their role first. |
| 413 | `content_too_large` | The body is too large. |
| 414 | `uri_too_long` | The query string is too long. |
| 415 | `unsupported_media_type` | The body must be JSON. |
| 422 | `invalid` | The body is not valid. `errors` lists every problem. |
| 429 | `too_many_runs` | Too many runs. Try again later. |
| 429 | `too_many_requests` | Too many requests. Try again later. |
| 500 | `internal` | Something went wrong in Lightning. |
| 501 | `not_implemented` | Not available on this instance. |
| 502 | `bad_gateway` | The channel could not reach its destination. |
| 503 | `service_unavailable` | Try again shortly. |
| 503 | `not_ready` | Not ready yet. Sent with `Retry-After`. |
| 504 | `timeout` | A synchronous webhook's workflow did not finish in time. |

A value that must be unique and is already in use is a 422 `invalid` with a
`taken` entry pointing at it, never a 409.

Every 401 carries a `WWW-Authenticate` header (the token endpoint's don't). An
expired service account token says so in it:
`error_description="The access token expired"`. A 403 `insufficient_scope`
carries one naming the scope you need, for example
`WWW-Authenticate: Bearer error="insufficient_scope", scope="credentials:write"`.
On `full-api-test` (not merged yet), a 401 on a route that takes the session
cookie carries `WWW-Authenticate: Session realm="Lightning"`.

## Entry codes

Codes that can appear on an entry in `errors`:

`already_scheduled`, `credential_not_allowed`, `cycle`, `dataclip_wiped`,
`deleting`, `discovery_failed`, `duplicate`, `exceeds_limit`, `exclusive`,
`format`, `invalid`, `missing_trigger_edge`, `mismatch`, `must_accept`,
`no_access`, `not_allowed`, `not_found`, `not_supported`, `one_body`,
`one_enabled`, `one_enabled_edge`, `one_owner`, `out_of_range`, `required`,
`reserved`, `scope_not_granted`, `single_target`, `storage_failed`, `taken`,
`too_long`, `too_many_secrets`, `too_short`, `tree_branch_conflict`,
`trigger_removed`, `type`, `unchanged`, `unknown_key`, `wrong_length`.

Response codes and entry codes are part of the API contract, listed in
`LightningWeb.API.Codes`. Adding one is compatible. Renaming or removing one, or
moving it to another status, is a breaking change.

## Unknown routes

Any path under `/api` or `/collections` that doesn't exist answers a 404
`not_found` problem document, before authentication. The problem document's
content type follows `Accept` here too.

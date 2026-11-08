# Organizations

An organization is the institution above a set of projects: a ministry, an
NGO, a company. Every project belongs to exactly one organization, and a
person can belong to many. Belonging to an organization gives no access to its
projects: who can open a project, and what they can do there, is still set by
its [members](./projects.md#list-a-projects-members). So a project's
workflows, credentials, runs and dataclips stay with its members alone.

An organization is not an instance. One Lightning instance holds many
organizations, and the same institution may run several instances, each with
its own organization and nothing shared between them.

Everything on this page is the first cut, from the
[Organizations epic brief](https://docs.google.com/document/d/13mPtNPwXU0Y1r3h2CH3Z8dpA9jw8A1FkiJx3Xf243dY/edit?tab=t.0).
What the brief asks for beyond it is listed under
[What comes later](#what-comes-later).

## Roles

| Role | Can |
| --- | --- |
| `admin` | Read the organization and its members, rename it, and add, remove and change the role of members. |
| `member` | Read the organization and its members. |

An organization always has at least one admin. A change that would leave it
with none is refused with a `one_admin` entry. There is no owner: any admin
can do anything another can.

A superuser can read and manage every organization on the instance, whether
or not they belong to it, and is the only person who can create one. The
service account can do everything, given `organizations:write`.

## Upgrading an instance

When an instance that has projects upgrades, Lightning makes one organization,
"Default organization", and puts every project in it, sandboxes included. Its
superusers become its admins, and everyone who is a member of one of its
projects becomes a member. Nobody gains access to a project they couldn't
open before. An admin can rename it afterwards.

## Get an organization

Status: **Planned**

```
GET /api/organizations/:id
```

Tokens: personal access token, or service account with `organizations:write`.

```json
{
  "data": {
    "type": "organizations",
    "id": "0d7f5f0e-3c1a-4b8e-9a52-6f1d2e3c4b5a",
    "attributes": {
      "name": "Ministry of Health",
      "role": "admin",
      "inserted_at": "2026-11-01T09:00:00Z",
      "updated_at": "2026-11-04T14:12:00Z"
    },
    "relationships": {},
    "links": { "self": "https://.../api/organizations/0d7f5f0e-..." }
  },
  "included": [],
  "links": { "self": "https://.../api/organizations/0d7f5f0e-..." }
}
```

`role` is yours in the organization, `admin` or `member`, or `null` for a
superuser or the service account who isn't in it. A client can offer an
organization's settings to an admin, or a superuser, and read-only to anyone
else.

Notable errors:

- 403 `forbidden` to a caller who isn't in the organization, whether or not it
  exists and whether or not the id is a UUID.
- 404 `not_found` for an id that names no organization, and 400
  `invalid_parameter` with a `path` entry for one that isn't a UUID. Only a
  superuser and the service account hear these.

## List organizations

Status: **Planned**

```
GET /api/organizations
```

Tokens: personal access token, or service account with `organizations:write`.
Paged: `page_size` defaults to 10, at most 100.

Lists the organizations you belong to, sorted by name. A superuser and the
service account get every organization on the instance. Each entry has the
same shape as `GET /api/organizations/:id`.

## Create an organization

Status: **Planned**

```
POST /api/organizations
```

Tokens: a superuser's personal access token, or service account with
`organizations:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. At most 160 characters. Need not be unique. |
| `members` | array of `{email, role}` | Optional. Each email must belong to an existing user. `role` is `admin` or `member`. |

A superuser who creates an organization becomes its first admin, unless they
list themselves with another role. The organization needs at least one admin,
so the service account must list one.

Answers 201 with the organization, in the same shape as `GET`.

Notable errors:

- 403 `forbidden` to anyone but a superuser or the service account.
- 422 `invalid` with a `not_found` entry at `#/members/N/email` for an email
  with no user, `duplicate` for a user listed twice, or a `one_admin` entry at
  `#/members` when no one would be an admin.

## Rename an organization

Status: **Planned**

```
PATCH /api/organizations/:id
```

Tokens: personal access token of an admin of the organization or a
superuser, or service account with `organizations:write`.

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. At most 160 characters. |

Answers 200 with the organization. Sending the same name again changes
nothing and records no audit event.

Notable errors:

- 403 `forbidden` to a member who isn't an admin, as well as to anyone outside
  the organization.

## List an organization's members

Status: **Planned**

```
GET /api/organizations/:organization_id/members
```

Tokens: as for getting the organization. Paged.

```json
{
  "data": [
    {
      "type": "organization_members",
      "id": "604f0cd2-37fb-4833-a5e1-821555b5b314",
      "attributes": {
        "email": "ada@example.com",
        "first_name": "Ada",
        "last_name": "Lovelace",
        "role": "admin",
        "inserted_at": "2026-11-01T09:00:00Z"
      },
      "relationships": {},
      "links": { "self": "https://.../api/organizations/0d7f5f0e-.../members/604f0cd2-..." }
    }
  ],
  "included": [],
  "links": { "self": "…", "first": "…", "last": "…", "next": null, "prev": null }
}
```

A member's `id` is their user id, as for a project's members. `inserted_at` is
when they joined. Members are sorted by first name.

## Add a member

Status: **Planned**

```
POST /api/organizations/:organization_id/members
```

Tokens: as for renaming the organization.

| Field | Type | Notes |
| --- | --- | --- |
| `email` | string | Required. Must belong to an existing user. |
| `role` | string | Required. `admin` or `member`. |

Adds the user to the organization. It gives them no access to its projects.
Answers 201 with the member, in the same shape as one entry of the list.

Notable errors:

- 422 `invalid` with a `not_found` entry at `#/email` when no user has the
  email, or a `taken` entry when they're already a member.

## Change a member's role

Status: **Planned**

```
PATCH /api/organizations/:organization_id/members/:user_id
```

Tokens: as for renaming the organization.

| Field | Type | Notes |
| --- | --- | --- |
| `role` | string | Required. `admin` or `member`. |

Answers 200 with the member. Sending the same role again changes nothing.

Notable errors:

- 404 `not_found` when the user isn't a member.
- 422 `invalid` with a `one_admin` entry at `#/role` when the change would
  leave the organization with no admin.

## Remove a member

Status: **Planned**

```
DELETE /api/organizations/:organization_id/members/:user_id
```

Tokens: as for renaming the organization.

Takes the user out of the organization. Their account stays as it is, and so
do their memberships of its projects: removing someone from a project is
[its own route](./projects.md#remove-a-member). An admin can remove
themselves. Answers 204 with no body.

Notable errors:

- 404 `not_found` when the user isn't a member.
- 422 `invalid` with a `one_admin` entry whose `path` is `user_id` when they're
  the last admin.

## A project's organization

Status: **Planned**

A project carries `organization_id` among its attributes on
`GET /api/projects/:id` and `GET /api/projects`. A sandbox carries its
parent's, and can't have another.

## Audit events

Each write records an audit event on the organization: `created`, `updated`
(with the name before and after), `member_added`, `member_role_changed` and
`member_removed` (each with the member's email and role).

## What comes later

The brief asks for these too. Each will be specified here when it's picked up.

- **Creating a project in an organization.** `organization_id` on
  `PUT /api/projects/:id`, required once you belong to more than one, and a
  project's member can create projects in their organizations without being a
  superuser.
- **Discoverable projects.** A setting on each project, on for new projects
  and off for existing ones, and a list of an organization's discoverable
  projects for its members, so colleagues can find each other's work. Asking
  to join one is later still.
- **Inviting someone new.** Adding an email with no account, as
  [project invitations](./projects.md#invite-someone-new-to-a-project) do.
- **Admins in projects.** An organization admin adding and removing project
  members, and through that reaching a project, and removing a leaver from
  every project at once.
- **Sign-ups.** Someone who registers on OpenFn's cloud gets an organization
  of their own, and the cloud's billing accounts become organizations when it
  upgrades.

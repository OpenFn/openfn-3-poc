# Lightning API reference

This page covers Lightning's HTTP API for clients outside Lightning: scripts,
CLIs, infrastructure automation and other services.

All paths are relative to your instance, for example
`https://app.openfn.org`. Request and response bodies are JSON unless a section
says otherwise.

## Contents

- [Authentication](./authentication.md): tokens, service accounts and scopes
- [Conventions](./conventions.md): identifiers, content types, idempotent writes, pagination, dates
- [Errors](./errors.md): problem documents, order of checks, response and entry codes, unknown routes
- [Projects](./projects.md): projects, members and sandboxes
- [Credentials](./credentials.md)
- [Collections](./collections.md): collections and their items
- [Users](./users.md)
- [Workflows](./workflows.md)
- [Jobs](./jobs.md)
- [Work orders](./work-orders.md): listing work orders and running a workflow
- [Runs](./runs.md): listing, cancelling and retrying runs, and their steps
- [Dataclips](./dataclips.md)
- [Log lines](./log-lines.md)
- [Provisioning](./provisioning.md): deploying and exporting a whole project
- [Webhooks](./webhooks.md)

## Status

Every endpoint carries a status:

| Status | Meaning |
| --- | --- |
| **Public** | Available now. Any client with the right token can call it. |
| **Private** | Lightning can already do this inside the app, but there is no API route for it yet. The spec here is how the route should look, following the same patterns as the public routes. Each one has an implementation note naming the function that does the work today and how it differs from the spec. |
| **Planned** | Lightning can't do this yet. No endpoints are planned yet, but some sections note token kinds that are planned for an existing endpoint. |

Some things the app can do have no route and aren't specified here yet:
channel management, webhook authentication methods, credential transfers,
keychain credentials, GitHub sync setup, and project file and history exports.

## All endpoints

| Method | Path | Status |
| --- | --- | --- |
| `GET` | [`/.well-known/oauth-authorization-server`](./authentication.md) | Public |
| `POST` | [`/api/oauth/token`](./authentication.md) | Public |
| `GET` | [`/api/projects`](./projects.md) | Public |
| `GET` | [`/api/projects/:id`](./projects.md) | Public |
| `PUT` | [`/api/projects/:id`](./projects.md) | Public |
| `DELETE` | [`/api/projects/:id`](./projects.md) | Private |
| `DELETE` | [`/api/projects/:id/scheduled_deletion`](./projects.md) | Private |
| `GET` | [`/api/projects/:project_id/members`](./projects.md) | Private |
| `PUT` | [`/api/projects/:project_id/members/:user_id`](./projects.md) | Private |
| `DELETE` | [`/api/projects/:project_id/members/:user_id`](./projects.md) | Private |
| `GET` | [`/api/projects/:project_id/sandboxes`](./projects.md) | Private |
| `PUT` | [`/api/projects/:project_id/sandboxes/:id`](./projects.md) | Private |
| `POST` | [`/api/projects/:project_id/sandboxes/:id/merges`](./projects.md) | Private |
| `GET` | [`/api/credentials`](./credentials.md) | Public |
| `GET` | [`/api/projects/:project_id/credentials`](./credentials.md) | Public |
| `POST` | [`/api/credentials`](./credentials.md) | Public |
| `GET` | [`/api/credentials/:id`](./credentials.md) | Public |
| `PUT` | [`/api/credentials/:id`](./credentials.md) | Public |
| `DELETE` | [`/api/credentials/:id`](./credentials.md) | Public |
| `GET` | [`/api/projects/:project_id/collections`](./collections.md) | Private |
| `GET` | [`/api/projects/:project_id/collections/:id`](./collections.md) | Public |
| `PUT` | [`/api/projects/:project_id/collections/:id`](./collections.md) | Public |
| `DELETE` | [`/api/projects/:project_id/collections/:id`](./collections.md) | Private |
| `GET` | [`/collections/:name`](./collections.md) | Public |
| `POST` | [`/collections/:name`](./collections.md) | Public |
| `DELETE` | [`/collections/:name`](./collections.md) | Public |
| `GET` | [`/collections/:name/:key`](./collections.md) | Public |
| `PUT` | [`/collections/:name/:key`](./collections.md) | Public |
| `DELETE` | [`/collections/:name/:key`](./collections.md) | Public |
| `GET` | [`/api/users`](./users.md) | Public |
| `POST` | [`/api/users`](./users.md) | Public |
| `GET` | [`/api/users/:id`](./users.md) | Public |
| `PATCH` | [`/api/users/:id`](./users.md) | Public |
| `DELETE` | [`/api/users/:id`](./users.md) | Private |
| `DELETE` | [`/api/users/:id/scheduled_deletion`](./users.md) | Private |
| `GET` | [`/api/workflows`](./workflows.md) | Public |
| `GET` | [`/api/workflows/:id`](./workflows.md) | Public |
| `GET` | [`/api/projects/:project_id/workflows`](./workflows.md) | Public |
| `POST` | [`/api/projects/:project_id/workflows`](./workflows.md) | Public |
| `GET` | [`/api/projects/:project_id/workflows/:id`](./workflows.md) | Public |
| `PATCH`, `PUT` | [`/api/projects/:project_id/workflows/:id`](./workflows.md) | Public |
| `DELETE` | [`/api/projects/:project_id/workflows/:id`](./workflows.md) | Private |
| `GET` | [`/api/jobs`, `/api/jobs/:id`, `/api/projects/:project_id/jobs`, `/api/projects/:project_id/jobs/:id`](./jobs.md) | Public |
| `GET` | [`/api/work_orders`, `/api/work_orders/:id`, `/api/projects/:project_id/work_orders`, `/api/projects/:project_id/work_orders/:id`](./work-orders.md) | Public |
| `POST` | [`/api/projects/:project_id/workflows/:workflow_id/work_orders`](./work-orders.md) | Private |
| `GET` | [`/api/runs`, `/api/runs/:id`, `/api/projects/:project_id/runs`, `/api/projects/:project_id/runs/:id`](./runs.md) | Public |
| `PATCH` | [`/api/runs/:id`](./runs.md) | Private |
| `POST` | [`/api/runs/:id/retries`](./runs.md) | Private |
| `GET` | [`/api/runs/:id/steps`](./runs.md) | Private |
| `GET` | [`/api/dataclips/:id`](./dataclips.md) | Private |
| `PATCH` | [`/api/dataclips/:id`](./dataclips.md) | Private |
| `GET` | [`/api/log_lines`](./log-lines.md) | Public |
| `POST` | [`/api/provision`](./provisioning.md) | Public |
| `GET` | [`/api/provision/:id`](./provisioning.md) | Public |
| `GET` | [`/api/provision/yaml`](./provisioning.md) | Public |
| `POST` | [`/i/:trigger_id`, `/i/:project_id/:custom_path`](./webhooks.md) | Public |
| `GET` | [`/i/:trigger_id`, `/i/:project_id/:custom_path`](./webhooks.md) | Public |

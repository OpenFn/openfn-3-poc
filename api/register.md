# Decoupling register

The [second decoupling experiment](https://github.com/OpenFn/context/tree/main/lightning/brandon/decoupling-experiment-v2)
designed a 16-service API for Lightning (`api-reqs/`). This register lists every
method from that design, one line each, and records where it stands in this API.

| Status | Meaning |
| --- | --- |
| **Public** | This API already has it, as designed. |
| **Private** | This API specifies it as a Private endpoint, as designed. |
| **Partial** | This API has it, but without something the design calls for. The endpoint's section lists the gap under "Planned additional scope". |
| **Planned** | New. Specified in this reference as a Planned endpoint. |
| **Misfit** | Doesn't belong in this API. [Misfits](./misfits.md) says why. |

The design's paths are its own, not this API's: it has no `/api` prefix, and
it addresses some nested resources at the top level. The "This API" column
gives the route here.

Rows in the design's verification tables that aren't methods (domain
libraries, background workers, "no public endpoint" notes) are left out.

## Summary

| Status | Methods |
| --- | --- |
| Public | 26 |
| Private | 19 |
| Partial | 26 |
| Planned | 65 |
| Misfit | 83 |
| **Total** | **219** |

## AccountService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `POST /session` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `POST /session/totp` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `DELETE /session` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `POST /session/sudo` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `POST /session/token_exchange` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `GET /me` | Planned | [`GET /api/me`](./users.md#get-the-current-user) | The user only. The design's session, consent and instance config parts are misfits; memberships come from `GET /api/projects`. |
| `POST /users` | Misfit | | [Self-service sign-up](./misfits.md#self-service-account-flows) |
| `POST /setup/superuser` | Misfit | | [First setup](./misfits.md#first-setup) |
| `PATCH /me` | Partial | [`PATCH /api/users/:id`](./users.md#update-a-user) | A person can't update themselves with a personal access token yet. |
| `PUT /me/password` | Misfit | | [Account security](./misfits.md#account-security) |
| `POST /password_resets` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /password_resets/:token` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /me/email_change` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /me/email_change/:token` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /confirmations` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /confirmations/:token` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `POST /me/mfa/totp` | Misfit | | [Account security](./misfits.md#account-security) |
| `POST /me/mfa/totp/activate` | Misfit | | [Account security](./misfits.md#account-security) |
| `DELETE /me/mfa/totp` | Misfit | | [Account security](./misfits.md#account-security) |
| `GET /me/backup_codes` | Misfit | | [Account security](./misfits.md#account-security) |
| `POST /me/backup_codes` | Misfit | | [Account security](./misfits.md#account-security) |
| `GET /me/tokens` | Planned | [`GET /api/me/tokens`](./users.md#list-your-personal-access-tokens) | |
| `POST /me/tokens` | Misfit | | [Account security](./misfits.md#account-security) |
| `DELETE /me/tokens/:id` | Planned | [`DELETE /api/me/tokens/:id`](./users.md#revoke-a-personal-access-token) | |
| `POST /me/deletion` | Misfit | | [Deleting your own account](./misfits.md#deleting-your-own-account) |
| `DELETE /me/deletion` | Misfit | | [Deleting your own account](./misfits.md#deleting-your-own-account) |
| `DELETE /me` | Misfit | | [Deleting your own account](./misfits.md#deleting-your-own-account) |
| `PUT /me/consent` | Misfit | | [Consent](./misfits.md#consent) |

## AiAssistantService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/ai/sessions` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `POST /projects/:project_id/ai/sessions` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `GET /ai/sessions/:id` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `PATCH /ai/sessions/:id` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `POST /ai/sessions/:id/messages` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `POST /ai/sessions/:id/messages/:message_id/retry` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `GET /ai/sessions/:id/events` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `GET /me/ai/disclaimer` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `PUT /me/ai/disclaimer` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `GET /ai/availability` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |
| `GET /projects/:project_id/ai/usage` | Misfit | | [AI assistant](./misfits.md#ai-assistant) |

## AuthorizationService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /me/permissions` | Misfit | | [Permission maps](./misfits.md#permission-maps-and-confirm-dialog-previews) |
| `authenticate/1` | Misfit | | [In-process contracts](./misfits.md#in-process-contracts) |
| `authorize/3` | Misfit | | [In-process contracts](./misfits.md#in-process-contracts) |
| `scope/3` | Misfit | | [In-process contracts](./misfits.md#in-process-contracts) |
| `assert_elevated/1` | Misfit | | [In-process contracts](./misfits.md#in-process-contracts) |

## ChannelService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/channels` | Planned | [`GET /api/projects/:project_id/channels`](./channels.md#list-a-projects-channels) | Counts ride on each row; the design's `summary` block is left out. |
| `GET /channels/:id` | Planned | [`GET /api/projects/:project_id/channels/:id`](./channels.md#get-a-channel) | |
| `POST /projects/:project_id/channels` | Planned | [`PUT /api/projects/:project_id/channels/:id`](./channels.md#create-or-replace-a-channel) | |
| `PATCH /channels/:id` | Planned | [`PUT /api/projects/:project_id/channels/:id`](./channels.md#create-or-replace-a-channel) | |
| `DELETE /channels/:id` | Planned | [`DELETE /api/projects/:project_id/channels/:id`](./channels.md#delete-a-channel) | |
| `GET /projects/:project_id/channel_requests` | Planned | [`GET /api/projects/:project_id/channel_requests`](./channels.md#list-channel-requests) | |
| `GET /channel_requests/:id` | Planned | [`GET /api/channel_requests/:id`](./channels.md#get-a-channel-request) | |
| `ANY /channels/:id/*` | Public | [`ANY /channels/:id/*path`](./channels.md#send-a-request-through-a-channel) | Live in Lightning but missing from this reference until now. |

## CollaborationService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `WS JOIN workflow:collaborate/:workflow_id[:vN]` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `WS SEND yjs.sync` / `yjs.update` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `GET workflow:collaborate/:workflow_id/session` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `POST workflow:collaborate/:workflow_id/save` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing). Saving outside the editor is `PATCH /api/projects/:project_id/workflows/:id`. |
| `POST workflow:collaborate/:workflow_id/save_and_sync` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing). Outside the editor: update the workflow, then `POST /api/projects/:project_id/repo_connection/syncs`. |
| `POST workflow:collaborate/:workflow_id/reset` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `POST workflow:collaborate/:workflow_id/ai_apply_lock` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `POST workflow:collaborate/:workflow_id/ai_apply_lock/release` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |
| `WS presence` | Misfit | | [Collaborative editing](./misfits.md#collaborative-editing) |

## CollectionsService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/collections` | Partial | [`GET /api/projects/:project_id/collections`](./collections.md#list-a-projects-collections) | Private. No storage size or sort yet. |
| `GET /collections` | Planned | [`GET /api/collections`](./collections.md#list-every-collection) | |
| `POST /projects/:project_id/collections` | Public | [`PUT /api/projects/:project_id/collections/:id`](./collections.md#create-or-rename-a-collection) | |
| `GET /projects/:project_id/collections/:name` | Partial | [`GET /api/projects/:project_id/collections/:id`](./collections.md#get-a-collection) | Addressed by id, not name. No storage size yet. |
| `PATCH /projects/:project_id/collections/:name` | Public | [`PUT /api/projects/:project_id/collections/:id`](./collections.md#create-or-rename-a-collection) | |
| `DELETE /projects/:project_id/collections/:name` | Private | [`DELETE /api/projects/:project_id/collections/:id`](./collections.md#delete-a-collection) | |
| `GET /projects/:project_id/collections/:name/items` | Public | [`GET /collections/:name`](./collections.md#stream-items) | |
| `GET /projects/:project_id/collections/:name/items/:key` | Public | [`GET /collections/:name/:key`](./collections.md#get-one-item) | |
| `PUT /projects/:project_id/collections/:name/items/:key` | Public | [`PUT /collections/:name/:key`](./collections.md#put-one-item) | |
| `POST /projects/:project_id/collections/:name/items` | Public | [`POST /collections/:name`](./collections.md#put-many-items) | |
| `DELETE /projects/:project_id/collections/:name/items/:key` | Public | [`DELETE /collections/:name/:key`](./collections.md#delete-one-item) | |
| `DELETE /projects/:project_id/collections/:name/items` | Public | [`DELETE /collections/:name`](./collections.md#delete-many-items) | |
| `GET /projects/:project_id/collections/:name/export` | Misfit | | [Browser downloads](./misfits.md#browser-downloads) |
| `/collections/:name/...` (legacy item API) | Public | [`/collections/:name`](./collections.md#collection-items) | |

## CredentialService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /credentials` | Public | [`GET /api/credentials`](./credentials.md#list-credentials) | |
| `GET /projects/:project_id/credentials` | Public | [`GET /api/projects/:project_id/credentials`](./credentials.md#list-credentials) | The design's `include=keychains` is the separate keychain list. |
| `GET /credentials/:id` | Public | [`GET /api/credentials/:id`](./credentials.md#get-a-credential) | |
| `POST /credentials` | Public | [`PUT /api/credentials/:id`](./credentials.md#create-or-replace-a-credential), [`POST /api/credentials`](./credentials.md#create-a-credential-owned-by-you) | |
| `PATCH /credentials/:id` | Partial | [`PUT /api/credentials/:id`](./credentials.md#create-or-replace-a-credential) | Only the `main` environment, and an OAuth refresh token must be resent. |
| `GET /credentials/:id/environments` | Planned | [`GET /api/credentials/:id/environments`](./credentials.md#list-a-credentials-environments) | |
| `PUT /credentials/:id/environments/:name` | Planned | [`PUT /api/credentials/:id/environments/:name`](./credentials.md#set-an-environment) | |
| `DELETE /credentials/:id/environments/:name` | Planned | [`DELETE /api/credentials/:id/environments/:name`](./credentials.md#delete-an-environment) | |
| `POST /credentials/:id/grants` | Planned | [`PUT /api/projects/:project_id/credentials/:id`](./credentials.md#link-a-credential-to-a-project) | `PUT /api/credentials/:id` can already add links. |
| `DELETE /credentials/:id/grants/:project_id` | Planned | [`DELETE /api/projects/:project_id/credentials/:id`](./credentials.md#unlink-a-credential-from-a-project) | |
| `GET /credentials/:id/dependent_workflows` | Partial | [`GET /api/workflows?credential_id=`](./workflows.md#list-workflows) | No `credential_id` filter yet. |
| `POST /credentials/:id/deletion` | Planned | [`PUT /api/credentials/:id/scheduled_deletion`](./credentials.md#schedule-a-credentials-deletion) | |
| `DELETE /credentials/:id/deletion` | Planned | [`DELETE /api/credentials/:id/scheduled_deletion`](./credentials.md#cancel-a-credentials-deletion) | |
| `DELETE /credentials/:id` | Public | [`DELETE /api/credentials/:id`](./credentials.md#delete-a-credential) | |
| `POST /credentials/:id/transfer` | Planned | [`PUT /api/credentials/:id/transfer`](./credentials.md#start-a-transfer) | |
| `DELETE /credentials/:id/transfer` | Planned | [`DELETE /api/credentials/:id/transfer`](./credentials.md#cancel-a-transfer) | |
| `POST /credential_transfers/confirm` | Misfit | | [Emailed links](./misfits.md#self-service-account-flows) |
| `GET /oauth_clients` | Planned | [`GET /api/oauth_clients`](./credentials.md#list-oauth-clients) | |
| `GET /projects/:project_id/oauth_clients` | Planned | [`GET /api/projects/:project_id/oauth_clients`](./credentials.md#list-oauth-clients) | |
| `POST /oauth_clients` | Planned | [`PUT /api/oauth_clients/:id`](./credentials.md#create-or-replace-an-oauth-client) | |
| `PATCH /oauth_clients/:id` | Planned | [`PUT /api/oauth_clients/:id`](./credentials.md#create-or-replace-an-oauth-client) | |
| `DELETE /oauth_clients/:id` | Planned | [`DELETE /api/oauth_clients/:id`](./credentials.md#delete-an-oauth-client) | |
| `GET /projects/:project_id/keychain_credentials` | Planned | [`GET /api/projects/:project_id/keychain_credentials`](./credentials.md#list-a-projects-keychain-credentials) | |
| `POST /projects/:project_id/keychain_credentials` | Planned | [`PUT /api/projects/:project_id/keychain_credentials/:id`](./credentials.md#create-or-replace-a-keychain-credential) | |
| `PATCH /keychain_credentials/:id` | Planned | [`PUT /api/projects/:project_id/keychain_credentials/:id`](./credentials.md#create-or-replace-a-keychain-credential) | |
| `DELETE /keychain_credentials/:id` | Planned | [`DELETE /api/projects/:project_id/keychain_credentials/:id`](./credentials.md#delete-a-keychain-credential) | |
| `GET /oauth_clients/:id/authorize_url` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `POST /oauth/callback` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `GET /credentials/:id/oauth/status` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `GET /credential_schemas` | Planned | [`GET /api/credential_schemas`](./credentials.md#list-credential-schemas) | |
| `GET /credential_schemas/:type` | Planned | [`GET /api/credential_schemas/:name`](./credentials.md#get-a-credential-schema) | |

## DataclipService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/dataclips` | Planned | [`GET /api/projects/:project_id/dataclips`](./dataclips.md#list-a-projects-dataclips) | Without the editor's next-cron-input marker. |
| `GET /dataclips/:id` | Private | [`GET /api/dataclips/:id`](./dataclips.md#get-a-dataclip) | |
| `GET /dataclips/:id/body` | Private | [`GET /api/dataclips/:id`](./dataclips.md#get-a-dataclip) | The body is part of the dataclip here, not a separate resource. |
| `PATCH /dataclips/:id` | Private | [`PATCH /api/dataclips/:id`](./dataclips.md#rename-a-dataclip) | |

## GithubSyncService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/repo_connection` | Planned | [`GET /api/projects/:project_id/repo_connection`](./github-sync.md#get-a-projects-repo-connection) | |
| `POST /projects/:project_id/repo_connection` | Planned | [`PUT /api/projects/:project_id/repo_connection`](./github-sync.md#connect-or-reconnect-a-repo) | |
| `PUT /projects/:project_id/repo_connection` | Planned | [`PUT /api/projects/:project_id/repo_connection`](./github-sync.md#connect-or-reconnect-a-repo) | |
| `DELETE /projects/:project_id/repo_connection` | Planned | [`DELETE /api/projects/:project_id/repo_connection`](./github-sync.md#disconnect-a-repo) | |
| `POST /projects/:project_id/repo_connection/sync` | Planned | [`POST /api/projects/:project_id/repo_connection/syncs`](./github-sync.md#sync-to-github) | |
| `GET /github/installations` | Misfit | | [GitHub discovery](./misfits.md#github-discovery) |
| `GET /github/installations/:installation_id/repos` | Misfit | | [GitHub discovery](./misfits.md#github-discovery) |
| `GET /github/repos/*repo/branches` | Misfit | | [GitHub discovery](./misfits.md#github-discovery) |
| `GET /projects/:project_id/provision` | Public | [`GET /api/provision/:id`, `GET /api/provision/yaml`](./provisioning.md#export-a-project) | |
| `POST /provision` | Public | [`POST /api/provision`](./provisioning.md#deploy-a-project) | |

## InstanceAdminService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /setup` | Misfit | | [First setup](./misfits.md#first-setup) |
| `POST /setup/superuser` | Misfit | | [First setup](./misfits.md#first-setup) |
| `GET /admin/users` | Partial | [`GET /api/users`](./users.md#list-users) | No search across names, sort, or deletion and support fields yet. |
| `GET /admin/users/:id` | Partial | [`GET /api/users/:id`](./users.md#get-a-user) | No deletion and support fields yet. |
| `POST /admin/users` | Public | [`POST /api/users`](./users.md#create-a-user) | |
| `PATCH /admin/users/:id` | Partial | [`PATCH /api/users/:id`](./users.md#update-a-user) | Can't set `support_user` or `disabled` yet. |
| `POST /admin/users/:id/deletion` | Private | [`DELETE /api/users/:id`](./users.md#delete-a-user) | |
| `DELETE /admin/users/:id/deletion` | Private | [`DELETE /api/users/:id/scheduled_deletion`](./users.md#cancel-a-users-deletion) | |
| `DELETE /admin/users/:id` | Misfit | | [Immediate purges](./misfits.md#immediate-purges) |
| `GET /admin/projects` | Partial | [`GET /api/projects`](./projects.md#list-projects) | Lists your own projects only; no instance-wide listing yet. |
| `GET /admin/projects/:id` | Partial | [`GET /api/projects/:id`](./projects.md#get-a-project) | No settings fields yet. |
| `POST /admin/projects` | Partial | [`PUT /api/projects/:id`](./projects.md#create-or-replace-a-project) | No colour, environment or concurrency yet. |
| `PATCH /admin/projects/:id` | Partial | [`PUT /api/projects/:id`](./projects.md#create-or-replace-a-project) | As for creating. Moving a project under a new parent stays out ([misfit](./misfits.md#re-parenting-a-project)). |
| `POST /admin/projects/:id/deletion` | Private | [`DELETE /api/projects/:id`](./projects.md#delete-a-project) | |
| `DELETE /admin/projects/:id/deletion` | Private | [`DELETE /api/projects/:id/scheduled_deletion`](./projects.md#cancel-a-projects-deletion) | |
| `DELETE /admin/projects/:id` | Misfit | | [Immediate purges](./misfits.md#immediate-purges) |
| `GET /admin/audit` | Planned | [`GET /api/audit_events`](./audit-events.md#list-audit-events) | |

## ProjectService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects` | Partial | [`GET /api/projects`](./projects.md#list-projects) | No sort or health stats yet. |
| `POST /projects` | Partial | [`PUT /api/projects/:id`](./projects.md#create-or-replace-a-project) | Creating needs a superuser; colour and environment aren't accepted yet. |
| `GET /projects/:id` | Partial | [`GET /api/projects/:id`](./projects.md#get-a-project) | No settings fields yet. |
| `PATCH /projects/:id` | Partial | [`PUT /api/projects/:id`](./projects.md#create-or-replace-a-project) | Name and description only. |
| `PUT /projects/:id/data_retention` | Planned | [`PUT /api/projects/:id/data_retention`](./projects.md#set-a-projects-data-retention) | |
| `PUT /projects/:id/mfa_requirement` | Planned | [`PUT /api/projects/:id/mfa_requirement`](./projects.md#require-mfa-on-a-project) | |
| `PUT /projects/:id/support_access` | Planned | [`PUT /api/projects/:id/support_access`](./projects.md#allow-support-access-to-a-project) | |
| `GET /projects/:id/members` | Partial | [`GET /api/projects/:project_id/members`](./projects.md#list-a-projects-members) | Private. No alert preferences yet. |
| `POST /projects/:id/members` | Private | [`PUT /api/projects/:project_id/members/:user_id`](./projects.md#add-a-member-or-change-their-role) | One member per call. |
| `POST /projects/:id/invitations` | Planned | [`POST /api/projects/:project_id/invitations`](./projects.md#invite-someone-new-to-a-project) | |
| `GET /projects/:id/members/:member_id/removability` | Misfit | | [Confirm-dialog previews](./misfits.md#permission-maps-and-confirm-dialog-previews) |
| `PATCH /projects/:id/members/:member_id` | Planned | [`PUT /api/projects/:project_id/members/:user_id/notifications`](./projects.md#set-your-notifications-for-a-project) | |
| `DELETE /projects/:id/members/:member_id` | Private | [`DELETE /api/projects/:project_id/members/:user_id`](./projects.md#remove-a-member) | |
| `POST /projects/:id/deletion` | Private | [`DELETE /api/projects/:id`](./projects.md#delete-a-project) | |
| `DELETE /projects/:id/deletion` | Private | [`DELETE /api/projects/:id/scheduled_deletion`](./projects.md#cancel-a-projects-deletion) | |
| `DELETE /projects/:id` | Misfit | | [Immediate purges](./misfits.md#immediate-purges) |

## RunService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/work_orders` | Partial | [`GET /api/projects/:project_id/work_orders`](./work-orders.md#list-and-get-work-orders) | No text search, sort or nested runs yet. |
| `GET /work_orders/:id` | Public | [`GET /api/work_orders/:id`](./work-orders.md#list-and-get-work-orders) | |
| `GET /runs/:id` | Public | [`GET /api/runs/:id`](./runs.md#list-and-get-runs) | Steps come from `GET /api/runs/:id/steps`. |
| `GET /runs/:id/steps` | Private | [`GET /api/runs/:id/steps`](./runs.md#list-a-runs-steps) | |
| `GET /runs/:id/logs` | Public | [`GET /api/log_lines?run_id=`](./log-lines.md#list-log-lines) | |
| `POST /projects/:project_id/workflows/:workflow_id/runs` | Private | [`POST /api/projects/:project_id/workflows/:workflow_id/work_orders`](./work-orders.md#run-a-workflow) | |
| `POST /runs/:id/retry` | Partial | [`POST /api/runs/:id/retries`](./runs.md#retry-a-run) | Private. Can't retry from the start without naming a step yet. |
| `POST /projects/:project_id/work_orders/retry` | Planned | [`POST /api/projects/:project_id/work_orders/retries`](./work-orders.md#retry-many-work-orders) | |
| `GET /projects/:project_id/work_orders/retriable_jobs` | Misfit | | [Confirm-dialog previews](./misfits.md#permission-maps-and-confirm-dialog-previews) |
| `POST /runs/:id/cancel` | Private | [`PATCH /api/runs/:id`](./runs.md#cancel-a-run) | |
| `POST /work_orders/:id/cancel` | Planned | [`PATCH /api/work_orders/:id`](./work-orders.md#cancel-a-work-order) | |
| `POST /projects/:project_id/work_orders/cancel` | Planned | [`POST /api/projects/:project_id/work_orders/cancellations`](./work-orders.md#cancel-many-work-orders) | |
| `POST /projects/:project_id/history/exports` | Planned | [`POST /api/projects/:project_id/history_exports`](./work-orders.md#export-history) | |
| `GET /projects/:project_id/history/exports` | Planned | [`GET /api/projects/:project_id/history_exports`](./work-orders.md#list-history-exports) | |
| `GET /projects/:project_id/history/exports/:id` | Planned | [`GET /api/projects/:project_id/history_exports/:id`](./work-orders.md#get-a-history-export) | |
| `run:<id>` follow channel | Misfit | | [Live channels](./misfits.md#live-channels) |
| Worker leg | Misfit | | [Worker protocol](./misfits.md#worker-protocol) |

## SandboxService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/sandboxes` | Partial | [`GET /api/projects/:project_id/sandboxes`](./projects.md#list-a-projects-sandboxes) | Private. Direct sandboxes only, and none scheduled for deletion. |
| `POST /projects/:project_id/sandboxes` | Private | [`PUT /api/projects/:project_id/sandboxes/:id`](./projects.md#create-a-sandbox) | |
| `PATCH /sandboxes/:id` | Partial | [`PUT /api/projects/:id`](./projects.md#create-or-replace-a-project) | No colour or environment yet. |
| `DELETE /sandboxes/:id` | Private | [`DELETE /api/projects/:id`](./projects.md#delete-a-project) | |
| `POST /sandboxes/:id/restore` | Private | [`DELETE /api/projects/:id/scheduled_deletion`](./projects.md#cancel-a-projects-deletion) | |
| `GET /sandboxes/:id/merge/targets` | Misfit | | [Confirm-dialog previews](./misfits.md#permission-maps-and-confirm-dialog-previews) |
| `GET /sandboxes/:id/merge/preview` | Planned | [`POST /api/projects/:project_id/sandboxes/:id/merge_previews`](./projects.md#preview-a-sandbox-merge) | |
| `POST /sandboxes/:id/merge` | Partial | [`POST /api/projects/:project_id/sandboxes/:id/merges`](./projects.md#merge-a-sandbox) | Private. Can't delete target workflows or pick credentials yet. |

## SsoService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /auth/providers` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `POST /sso/authorizations` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `GET /sso/callback` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `GET /sso/pending-signup` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `POST /sso/pending-signup/confirm` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `DELETE /sso/pending-signup` | Misfit | | [Browser sign-in](./misfits.md#browser-sign-in-and-sessions) |
| `GET /me/identities` | Misfit | | [Account security](./misfits.md#account-security) |
| `DELETE /me/identities/:id` | Misfit | | [Account security](./misfits.md#account-security) |
| `GET /auth/provider-config` | Planned | [`GET /api/auth_provider`](./authentication.md#get-the-sign-in-provider) | |
| `PUT /auth/provider-config` | Planned | [`PUT /api/auth_provider`](./authentication.md#set-the-sign-in-provider) | |
| `DELETE /auth/provider-config` | Planned | [`DELETE /api/auth_provider`](./authentication.md#remove-the-sign-in-provider) | |
| `POST /auth/provider-config/test` | Misfit | | [Form helpers](./misfits.md#form-helpers) |
| `POST /me/github-connection/authorize` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `GET /oauth/github/callback` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `GET /me/github-connection` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |
| `DELETE /me/github-connection` | Misfit | | [OAuth consent](./misfits.md#oauth-consent-flows) |

## TriggerService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/webhook_auth_methods` | Planned | [`GET /api/projects/:project_id/webhook_auth_methods`](./webhooks.md#list-a-projects-webhook-auth-methods) | |
| `POST /projects/:project_id/webhook_auth_methods` | Planned | [`PUT /api/projects/:project_id/webhook_auth_methods/:id`](./webhooks.md#create-or-replace-a-webhook-auth-method) | |
| `GET /webhook_auth_methods/:id` | Planned | [`GET /api/projects/:project_id/webhook_auth_methods/:id`](./webhooks.md#get-a-webhook-auth-method) | |
| `PATCH /webhook_auth_methods/:id` | Planned | [`PUT /api/projects/:project_id/webhook_auth_methods/:id`](./webhooks.md#create-or-replace-a-webhook-auth-method) | |
| `DELETE /webhook_auth_methods/:id` | Planned | [`DELETE /api/projects/:project_id/webhook_auth_methods/:id`](./webhooks.md#delete-a-webhook-auth-method) | |
| `POST /webhook_auth_methods/:id/reveal` | Misfit | | [Account security](./misfits.md#account-security) |
| `GET /webhook_auth_methods/:id/triggers` | Planned | [`GET /api/projects/:project_id/webhook_auth_methods/:id`](./webhooks.md#get-a-webhook-auth-method) | `triggers` on the auth method. |
| `GET /triggers/:trigger_id/webhook_auth_methods` | Partial | [`GET /api/workflows/:id`](./workflows.md#the-workflow-object) | No `webhook_auth_method_ids` on triggers yet. |
| `PUT /triggers/:trigger_id/webhook_auth_methods` | Partial | [`PATCH /api/projects/:project_id/workflows/:id`](./workflows.md#update-a-workflow) | As above. |
| `POST /triggers/cron/preview` | Misfit | | [Form helpers](./misfits.md#form-helpers) |
| `POST /i/*path` | Public | [`POST /i/:trigger_id`](./webhooks.md#trigger-a-workflow) | |
| `GET /i/*path` | Public | [`GET /i/:trigger_id`](./webhooks.md#check-a-webhook) | |

## WorkflowService

| Method | Status | This API | Notes |
| --- | --- | --- | --- |
| `GET /projects/:project_id/workflows` | Partial | [`GET /api/projects/:project_id/workflows`](./workflows.md#list-workflows) | No search, sort, paging or run stats yet. |
| `GET /workflows/:id` | Public | [`GET /api/workflows/:id`](./workflows.md#get-a-workflow) | Old versions come from snapshots. |
| `POST /projects/:project_id/workflows` | Partial | [`POST /api/projects/:project_id/workflows`](./workflows.md#create-a-workflow) | Can't start from a template yet. |
| `PUT /workflows/:id` | Public | [`PATCH /api/projects/:project_id/workflows/:id`](./workflows.md#update-a-workflow) | |
| `POST /projects/:project_id/workflows/validate` | Planned | [`POST /api/projects/:project_id/workflows/validations`](./workflows.md#validate-a-workflow) | |
| `DELETE /workflows/:id` | Private | [`DELETE /api/projects/:project_id/workflows/:id`](./workflows.md#delete-a-workflow) | |
| `PUT /workflows/:id/triggers_enabled` | Public | [`PATCH /api/projects/:project_id/workflows/:id`](./workflows.md#update-a-workflow) | Send the triggers with `enabled` set. |
| `GET /workflows/:id/snapshots` | Planned | [`GET /api/workflows/:id/snapshots`](./workflows.md#list-a-workflows-snapshots) | |
| `GET /workflows/:id/snapshots/:lock_version` | Planned | [`GET /api/workflows/:id/snapshots/:snapshot_id`](./workflows.md#get-a-snapshot) | Addressed by snapshot id, as provisioning does. |
| `GET /workflows/:id/versions` | Planned | [`GET /api/workflows/:id/versions`](./workflows.md#list-a-workflows-versions) | |
| `GET /workflows/:id/context` | Misfit | | [Page-shaped aggregates](./misfits.md#page-shaped-aggregates) |
| `GET /templates` | Planned | [`GET /api/workflow_templates`](./workflows.md#list-workflow-templates) | |
| `PUT /workflows/:id/template` | Planned | [`PUT /api/workflows/:id/template`](./workflows.md#publish-a-workflow-as-a-template) | |

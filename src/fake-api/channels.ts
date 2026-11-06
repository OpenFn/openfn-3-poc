/** Channels, the requests made through them, and the webhook auth methods they check, on the pretend server (api/channels.md, api/webhooks.md). */
import { channelRequests as requestFixtures } from "@/mock-data/channel-requests";
import { channels as fixtures } from "@/mock-data/channels";
import type { ChannelRequest } from "@/mock-data/models/channels";
import { webhookAuthMethods, webhookAuthMethodsIn } from "@/mock-data/project-settings";
import { SEEDED_AT, forbidden, invalid, isUrl, json, noContent, notFound, now, ORIGIN, paged, problem, type Body, type Handler, type Problem } from "./answers";
import { credentialName, isCredentialIn } from "./credentials";
import { canEnter, findProject, permissionsIn } from "./projects";

interface StoredChannel {
  id: string;
  project_id: string;
  name: string;
  destination_url: string;
  enabled: boolean;
  lock_version: number;
  client_auth_method_ids: string[];
  destination_credential_id: string | null;
  request_count: number;
  last_activity: string | null;
  inserted_at: string;
  updated_at: string;
}

// The fake's own copy, like projects.
const seed = (): StoredChannel[] =>
  fixtures.map((c) => ({
    id: c.id,
    project_id: c.projectId,
    name: c.name,
    destination_url: c.destinationUrl,
    enabled: c.enabled,
    lock_version: c.lockVersion,
    client_auth_method_ids: [...c.clientAuthMethodIds],
    destination_credential_id: c.destinationCredentialId,
    request_count: c.requestCount,
    last_activity: c.lastActivityAt,
    inserted_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  }));
let channels = seed();

/** For stories and tests: the starting channels. */
export const resetChannels = () => {
  channels = seed();
};

const channelJson = ({ id, project_id, ...attributes }: StoredChannel) => ({
  type: "channels",
  id,
  attributes: { ...attributes, url: `${ORIGIN}/channels/${id}` },
  relationships: {},
  links: { self: `${ORIGIN}/api/projects/${project_id}/channels/${id}` },
});

/** The problems with a create or replace body, as one list (api/errors.md). */
function check(projectId: string, id: string, body: Body): NonNullable<Problem["errors"]> {
  const errors: NonNullable<Problem["errors"]> = [];
  const name = typeof body["name"] === "string" ? body["name"] : "";
  const url = typeof body["destination_url"] === "string" ? body["destination_url"] : "";
  if (name.trim() === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/name" });
  else if (channels.some((c) => c.project_id === projectId && c.id !== id && c.name === name)) {
    errors.push({ code: "taken", detail: "A channel with this name already exists in this project", pointer: "#/name" });
  }
  if (url.trim() === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/destination_url" });
  else if (!isUrl(url)) errors.push({ code: "format", detail: "must be either a http or https URL", pointer: "#/destination_url" });
  const methods = webhookAuthMethodsIn(projectId).map((m) => m.id);
  const methodIds = body["client_auth_method_ids"] ?? [];
  if (!Array.isArray(methodIds)) errors.push({ code: "type", detail: "is not a list", pointer: "#/client_auth_method_ids" });
  else methodIds.forEach((methodId, i) => {
    if (!methods.includes(methodId as string)) errors.push({ code: "not_found", detail: "is not one of this project's webhook auth methods", pointer: `#/client_auth_method_ids/${i}` });
  });
  if (body["enabled"] !== undefined && typeof body["enabled"] !== "boolean") errors.push({ code: "type", detail: "is not a boolean", pointer: "#/enabled" });
  const credential = body["destination_credential_id"];
  if (credential != null && (typeof credential !== "string" || !isCredentialIn(projectId, credential))) {
    errors.push({ code: "not_found", detail: "is not a credential in this project", pointer: "#/destination_credential_id" });
  }
  return errors;
}

// Nothing writes requests, so the fake's copy is the fixtures plus two of its own on SHR proxy: a wiped
// request, and one whose client auth method and destination credential have since been deleted.
const shr = requestFixtures[0]!;
const requests: ChannelRequest[] = [
  ...requestFixtures,
  { ...shr, id: "e5b1c7d3-0a9f-4b2e-8d6c-3f1a5e7b9c02", requestId: "1a3c5e7f-9b2d-4f6a-8c0e-2d4f6b8a0c13", isWiped: true },
  { ...shr, id: "b8d4f0a2-6c1e-4a3b-9f7d-5e2c8a0b4d61", requestId: "7e9a1c3b-5d2f-4b8e-a6c0-9f1d3b5e7a24", clientWebhookAuthMethodId: "wam-deleted", destinationCredentialId: "cred-deleted" },
];

const SECRET_HEADERS = ["authorization", "x-api-key", "cookie", "set-cookie"];
const redact = (headers: [string, string][] | null) =>
  headers?.map(([name, value]) => [name, SECRET_HEADERS.includes(name.toLowerCase()) ? "[REDACTED]" : value]) ?? null;

// The fake's copy of Lightning's error_category (channel_request_live/helpers.ex).
const TRANSPORT_ERRORS = ["nxdomain", "econnrefused", "ehostunreach", "enetunreach", "closed", "econnreset", "econnaborted", "epipe", "connect_timeout", "response_timeout", "timeout"];
const CREDENTIAL_ERRORS = ["credential_missing_auth_fields", "credential_environment_not_found", "oauth_refresh_failed", "oauth_reauthorization_required"];
const errorCategory = (code: string) => {
  if (TRANSPORT_ERRORS.includes(code)) return "transport";
  if (CREDENTIAL_ERRORS.includes(code) || code.startsWith("unsupported_credential_schema:")) return "credential";
  return null;
};

// The detail's fields under Lightning's column names.
function channelRequestJson(r: ChannelRequest) {
  const event = r.events.find((e) => e.type === "destination_response") ?? r.events.find((e) => e.type === "error");
  const kept = <T,>(value: T) => (r.isWiped ? null : value);
  return {
    type: "channel_requests",
    id: r.id,
    attributes: {
      channel_id: r.channelId,
      request_id: r.requestId,
      state: r.state,
      path: kept(event?.requestPath ?? null),
      error_message: event?.errorMessage ?? null,
      started_at: r.startedAt,
      completed_at: r.completedAt,
      client_identity: kept(r.clientIdentity),
      client_auth: {
        type: r.clientAuthType,
        method_id: r.clientWebhookAuthMethodId,
        method_name: webhookAuthMethods.find((m) => m.id === r.clientWebhookAuthMethodId)?.name ?? null,
      },
      destination_credential: r.destinationCredentialId && { id: r.destinationCredentialId, name: credentialName(r.destinationCredentialId) },
      channel_snapshot: { name: r.snapshot.name, destination_url: r.snapshot.destinationUrl, lock_version: r.snapshot.lockVersion },
      request: event ? {
        method: event.requestMethod,
        path: kept(event.requestPath),
        query_string: kept(event.requestQueryString),
        headers: kept(redact(event.requestHeaders)),
        body: kept(event.requestBodyPreview),
        body_size: event.requestBodySize,
      } : null,
      response: event?.responseStatus == null ? null : {
        status: event.responseStatus,
        headers: kept(redact(event.responseHeaders)),
        body: kept(event.responseBodyPreview),
        body_size: event.responseBodySize,
      },
      error_category: event?.errorMessage ? errorCategory(event.errorMessage) : null,
      timing: event ? {
        latency_us: event.latencyUs,
        queue_us: event.queueUs,
        connect_us: event.connectUs,
        request_send_us: event.requestSendUs,
        ttfb_us: event.ttfbUs,
        response_duration_us: event.responseDurationUs,
      } : null,
      wiped: r.isWiped,
    },
    relationships: {},
    links: { self: `${ORIGIN}/api/channel_requests/${r.id}` },
  };
}

export const channelRoutes: Record<string, Handler> = {
  // Private. An id it doesn't hold, malformed included, is 403 like a project the caller can't enter:
  // nobody hears 404 on a top-level record (api/errors.md).
  "GET /api/channel_requests/:id": ({ id }) => {
    const found = requests.find((r) => r.id === id);
    const project = findProject(found?.projectId);
    if (!found || !project || !canEnter(project)) return forbidden();
    const data = channelRequestJson(found);
    return json(200, { data, included: [], links: data.links });
  },
  // Paged, by name; meta has the whole project's totals on every page.
  "GET /api/projects/:project_id/channels": ({ project_id }, _body, query) => {
    const project = findProject(project_id);
    // 403 whether or not the project exists.
    if (!project || !canEnter(project)) return forbidden();
    const mine = channels.filter((c) => c.project_id === project_id).sort((a, b) => a.name.localeCompare(b.name));
    return json(200, {
      ...paged(`/api/projects/${project_id}/channels`, mine.map(channelJson), query),
      meta: { total_channels: mine.length, total_requests: mine.reduce((sum, c) => sum + c.request_count, 0) },
    });
  },
  // Creates the channel at :id, or replaces it. Lightning picks the id on create today (api/channels.md).
  "PUT /api/projects/:project_id/channels/:id": ({ project_id, id }, body) => {
    const project = findProject(project_id);
    if (!project || !canEnter(project)) return forbidden();
    const existing = channels.find((c) => c.id === id);
    // Another project's channel is one this project doesn't have.
    if (existing && existing.project_id !== project_id) return notFound();
    if (!permissionsIn(project)[existing ? "update_channel" : "create_channel"]) return forbidden();
    const errors = check(project_id!, id!, body);
    if (errors.length) return invalid(errors);
    // A version sent for a channel that's gone is stale too: someone deleted it (docs/api-gaps.md).
    if (body["lock_version"] !== undefined && body["lock_version"] !== existing?.lock_version) {
      return problem({ status: 409, code: "concurrent_edit", detail: "Someone else changed this channel since you loaded it. Load it again and retry." });
    }
    const fields = {
      name: body["name"] as string,
      destination_url: body["destination_url"] as string,
      enabled: body["enabled"] !== false,
      client_auth_method_ids: (body["client_auth_method_ids"] ?? []) as string[],
      destination_credential_id: (body["destination_credential_id"] ?? null) as string | null,
    };
    if (existing) {
      const changed = Object.entries(fields).some(([key, value]) => JSON.stringify(value) !== JSON.stringify(existing[key as keyof typeof fields]));
      if (changed) Object.assign(existing, fields, { lock_version: existing.lock_version + 1, updated_at: now() });
      return json(200, { data: channelJson(existing) });
    }
    const at = now();
    const created: StoredChannel = { id: id!, project_id: project_id!, ...fields, lock_version: 1, request_count: 0, last_activity: null, inserted_at: at, updated_at: at };
    channels = [...channels, created];
    return json(201, { data: channelJson(created) });
  },
  // The 409 for a request arriving mid-delete comes only through failNext.
  "DELETE /api/projects/:project_id/channels/:id": ({ project_id, id }) => {
    const project = findProject(project_id);
    if (!project || !canEnter(project) || !permissionsIn(project)["delete_channel"]) return forbidden();
    if (!channels.some((c) => c.id === id && c.project_id === project_id)) return notFound();
    channels = channels.filter((c) => c.id !== id);
    return noContent();
  },
  // Any member, paged by name. None of the fixtures is scheduled for deletion, so none is left out.
  "GET /api/projects/:project_id/webhook_auth_methods": ({ project_id }, _body, query) => {
    const project = findProject(project_id);
    if (!project || !canEnter(project)) return forbidden();
    const rows = webhookAuthMethodsIn(project.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({
        type: "webhook_auth_methods",
        id: m.id,
        attributes: {
          name: m.name,
          auth_type: m.authType,
          username: m.username ?? null,
          api_key_last_characters: m.apiKey?.slice(-5) ?? null,
          triggers: [],
          inserted_at: SEEDED_AT,
          updated_at: SEEDED_AT,
        },
        relationships: {},
        links: { self: `${ORIGIN}/api/projects/${project.id}/webhook_auth_methods/${m.id}` },
      }));
    return json(200, paged(`/api/projects/${project.id}/webhook_auth_methods`, rows, query));
  },
};

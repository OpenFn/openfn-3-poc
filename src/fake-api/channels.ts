/** Channels and the webhook auth methods they check, on the pretend server (api/channels.md, api/webhooks.md). */
import { channels as fixtures } from "@/mock-data/channels";
import { webhookAuthMethodsIn } from "@/mock-data/project-settings";
import { SEEDED_AT, forbidden, invalid, isUrl, json, noContent, notFound, now, ORIGIN, paged, problem, type Body, type Handler, type Problem } from "./answers";
import { isCredentialIn } from "./credentials";
import { permissionsIn } from "./permissions";
import { canEnter, findProject } from "./projects";

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

export const channelRoutes: Record<string, Handler> = {
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

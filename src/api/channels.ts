/** Channels on Lightning's API (api/channels.md): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChannelFormValues, ChannelRequestDetail, ChannelRequestState, ChannelRow } from "@/types/channels";
import type { ResourceStatus } from "@/types/resource";
import { listAll, request, statusOf } from "./client";

/** A channel as `GET /api/projects/:project_id/channels` lists it. */
export interface ApiChannel {
  id: string;
  attributes: {
    name: string;
    destination_url: string;
    enabled: boolean;
    lock_version: number;
    url: string;
    client_auth_method_ids: string[];
    destination_credential_id: string | null;
    request_count: number;
    last_activity: string | null;
    inserted_at: string;
    updated_at: string;
  };
}

type ApiHeaders = [string, string][] | null;

/** A request through a channel as `GET /api/channel_requests/:id` sends it. */
export interface ApiChannelRequest {
  id: string;
  attributes: {
    channel_id: string;
    request_id: string;
    state: ChannelRequestState;
    path: string | null;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
    client_identity: string | null;
    client_auth: { type: "api" | "basic" | null; method_id: string | null; method_name: string | null };
    destination_credential: { id: string; name: string | null } | null;
    channel_snapshot: { name: string; destination_url: string; lock_version: number };
    request: { method: string; path: string | null; query_string: string | null; headers: ApiHeaders; body: string | null; body_size: number | null } | null;
    response: { status: number; headers: ApiHeaders; body: string | null; body_size: number | null } | null;
    error_category: "credential" | "transport" | null;
    timing: {
      latency_us: number | null;
      queue_us: number | null;
      connect_us: number | null;
      request_send_us: number | null;
      ttfb_us: number | null;
      response_duration_us: number | null;
    } | null;
    wiped: boolean;
  };
}

/** A row of a project's Channels list. */
export function channelRow({ id, attributes: a }: ApiChannel): ChannelRow {
  return {
    id,
    name: a.name,
    enabled: a.enabled,
    destinationUrl: a.destination_url,
    proxyUrl: a.url,
    requestCount: a.request_count,
    lastActivityAt: a.last_activity,
    clientAuthMethodIds: a.client_auth_method_ids,
    destinationCredentialId: a.destination_credential_id,
    lockVersion: a.lock_version,
  };
}

/** One channel request, for its page. */
export function channelRequestDetail({ id, attributes: a }: ApiChannelRequest): ChannelRequestDetail {
  const { request: sent, response, timing: t } = a;
  return {
    id,
    requestId: a.request_id,
    channelId: a.channel_id,
    state: a.state,
    startedAt: a.started_at,
    completedAt: a.completed_at,
    clientIdentity: a.client_identity,
    clientAuth: { type: a.client_auth.type, methodId: a.client_auth.method_id, methodName: a.client_auth.method_name },
    destinationCredential: a.destination_credential && { id: a.destination_credential.id, name: a.destination_credential.name },
    snapshot: { name: a.channel_snapshot.name, destinationUrl: a.channel_snapshot.destination_url, lockVersion: a.channel_snapshot.lock_version },
    request: sent && { method: sent.method, path: sent.path, queryString: sent.query_string, headers: sent.headers, body: sent.body, bodySize: sent.body_size },
    response: response && { status: response.status, headers: response.headers, body: response.body, bodySize: response.body_size },
    errorMessage: a.error_message,
    errorCategory: a.error_category,
    timing: t && {
      latencyUs: t.latency_us,
      queueUs: t.queue_us,
      connectUs: t.connect_us,
      requestSendUs: t.request_send_us,
      ttfbUs: t.ttfb_us,
      responseDurationUs: t.response_duration_us,
    },
    wiped: a.wiped,
  };
}

export const channelKeys = {
  inProject: (projectId: string) => ["projects", projectId, "channels"] as const,
  request: (id: string) => ["channel_requests", id] as const,
};

/** A project's channels, every page, by name, and where loading them stands. */
export function useChannels(projectId: string): { status: ResourceStatus; channels: ChannelRow[] } {
  const query = useQuery({
    queryKey: channelKeys.inProject(projectId),
    queryFn: () => listAll<ApiChannel>(`/api/projects/${projectId}/channels`, "data"),
    select: (rows) => rows.map(channelRow),
  });
  return { status: statusOf(query), channels: query.data ?? [] };
}

/** One channel request, from any project the person may open, and where loading it stands. */
export function useChannelRequest(id: string): { status: ResourceStatus; channelRequest: ChannelRequestDetail | undefined } {
  const query = useQuery({
    queryKey: channelKeys.request(id),
    queryFn: () => request<{ data: ApiChannelRequest }>("GET", `/api/channel_requests/${encodeURIComponent(id)}`).then((answer) => answer.data),
    select: channelRequestDetail,
  });
  return { status: statusOf(query), channelRequest: query.data };
}

/** What `PUT` takes: the form's fields, and the version an update was read at. */
type ChannelInput = ChannelFormValues & { lock_version?: number };

/** The whole channel as `PUT` takes it, with `changes` over what was listed, at the version it was listed at. */
const replacement = (c: ChannelRow, changes: Partial<ChannelFormValues>): ChannelInput => ({
  name: c.name,
  destination_url: c.destinationUrl,
  enabled: c.enabled,
  destination_credential_id: c.destinationCredentialId,
  client_auth_method_ids: c.clientAuthMethodIds,
  ...changes,
  lock_version: c.lockVersion,
});

/** Create, replace (the form, and the switch) and delete. Each settles once the list has reloaded. */
export function useChannelSaves(projectId: string) {
  const queryClient = useQueryClient();
  const reload = () => queryClient.invalidateQueries({ queryKey: channelKeys.inProject(projectId) });
  const path = (id: string) => `/api/projects/${projectId}/channels/${id}`;
  // A refused save or delete reloads too, so the switch's next try carries the latest version and a channel
  // someone else deleted leaves the list.
  const put = useMutation({ mutationFn: ({ id, body }: { id: string; body: ChannelInput }) => request("PUT", path(id), body), onSettled: reload });
  const remove = useMutation({ mutationFn: (id: string) => request("DELETE", path(id)), onSettled: reload });
  return {
    create: async (values: ChannelFormValues) => void (await put.mutateAsync({ id: crypto.randomUUID(), body: values })),
    update: async (channel: ChannelRow, changes: Partial<ChannelFormValues>) =>
      void (await put.mutateAsync({ id: channel.id, body: replacement(channel, changes) })),
    remove: async (id: string) => void (await remove.mutateAsync(id)),
  };
}

/** Channels on Lightning's API (api/channels.md): the API's shape, its mapper, its keys, and the hooks a .query file calls. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChannelFormValues, ChannelRow } from "@/types/channels";
import type { ResourceStatus } from "@/types/resource";
import { listAll, renameFields, request, statusOf } from "./client";

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

export const channelKeys = { inProject: (projectId: string) => ["projects", projectId, "channels"] as const };

/** A project's channels, every page, by name, and where loading them stands. */
export function useChannels(projectId: string): { status: ResourceStatus; channels: ChannelRow[] } {
  const query = useQuery({
    queryKey: channelKeys.inProject(projectId),
    queryFn: () => listAll<ApiChannel>(`/api/projects/${projectId}/channels`, "data"),
    select: (rows) => rows.map(channelRow),
  });
  return { status: statusOf(query), channels: query.data ?? [] };
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
  // someone else deleted leaves the list. A refused auth method (`#/client_auth_method_ids/0`) drops its index,
  // so it lands on the form's one field.
  const put = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ChannelInput }) =>
      request("PUT", path(id), body).catch((error: unknown) => Promise.reject(renameFields(error, { client_auth_method_ids: "client_auth_method_ids" }))),
    onSettled: reload,
  });
  const remove = useMutation({ mutationFn: (id: string) => request("DELETE", path(id)), onSettled: reload });
  return {
    create: async (values: ChannelFormValues) => void (await put.mutateAsync({ id: crypto.randomUUID(), body: values })),
    update: async (channel: ChannelRow, changes: Partial<ChannelFormValues>) =>
      void (await put.mutateAsync({ id: channel.id, body: replacement(channel, changes) })),
    remove: async (id: string) => void (await remove.mutateAsync(id)),
  };
}

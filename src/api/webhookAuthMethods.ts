/** Webhook auth methods on Lightning's API (api/webhooks.md): the API's shape, its keys, and the hooks a .query file calls. */
import { useQuery } from "@tanstack/react-query";
import type { ResourceStatus } from "@/types/resource";
import { listAll, statusOf } from "./client";

/** A webhook auth method as `GET /api/projects/:project_id/webhook_auth_methods` lists it: only what the channel form reads. */
export interface ApiWebhookAuthMethod {
  id: string;
  attributes: { name: string };
}

export const webhookAuthMethodKeys = { inProject: (projectId: string) => ["projects", projectId, "webhook_auth_methods"] as const };

/** A project's webhook auth methods as [name, id] options, by name, loaded while `enabled`; and where loading them stands. */
export function useWebhookAuthMethodOptions(projectId: string, enabled: boolean): { status: ResourceStatus; options: [label: string, value: string][] } {
  const query = useQuery({
    queryKey: webhookAuthMethodKeys.inProject(projectId),
    queryFn: () => listAll<ApiWebhookAuthMethod>(`/api/projects/${projectId}/webhook_auth_methods`, "data"),
    enabled,
    select: (rows) => rows.map((m): [string, string] => [m.attributes.name, m.id]),
  });
  return { status: statusOf(query), options: query.data ?? [] };
}
